import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";
import { AIAnalysis } from "@/types/database";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const UPLOAD_TIMEOUT_MS = 120000; // 2 min for slow networks
const ANALYSIS_TIMEOUT_MS = 90000; // 90 sec for AI analysis

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
}

const BUCKETS_TO_TRY = ["videos", "gait-videos"] as const;

/**
 * Resolves a video URI to a path we can read. On Android, content:// URIs
 * often fail with fetch/readAsStringAsync; copy to cache first.
 */
async function resolveVideoUri(videoUri: string): Promise<string> {
  const trimmed = (videoUri ?? "").trim();
  if (!trimmed) {
    throw new Error("No video file. Ensure the recording completed and try again.");
  }

  // On Android, content:// URIs are unreliable for direct read - copy to cache first
  if (Platform.OS === "android" && trimmed.startsWith("content://")) {
    const cachePath = `${FileSystem.cacheDirectory}arisole_video_${Date.now()}.mp4`;
    try {
      await FileSystem.copyAsync({ from: trimmed, to: cachePath });
      const info = await FileSystem.getInfoAsync(cachePath);
      if (!info.exists || (info.size != null && info.size < 1000)) {
        await FileSystem.deleteAsync(cachePath, { idempotent: true });
        throw new Error("Video file is empty or invalid. Please record again.");
      }
      return cachePath;
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("empty") || msg.includes("invalid")) throw e;
      throw new Error(
        "Could not read video file. Ensure the recording completed and try again."
      );
    }
  }

  // Validate file exists for file:// URIs
  if (trimmed.startsWith("file://")) {
    const info = await FileSystem.getInfoAsync(trimmed);
    if (!info.exists) {
      throw new Error("Video file not found. Please record again.");
    }
    if (info.size != null && info.size < 1000) {
      throw new Error("Video file is too small. Please record at least 5 seconds.");
    }
  }

  return trimmed;
}

export async function uploadVideo(videoUri: string, userId: string): Promise<string> {
  const resolvedUri = await resolveVideoUri(videoUri);
  const fileName = `${userId}/${Date.now()}.mp4`;
  const isTempCopy = resolvedUri !== videoUri;

  let body: Blob | ArrayBuffer;
  try {
    const response = await fetch(resolvedUri);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    body = await response.blob();
  } catch {
    try {
      const base64 = await FileSystem.readAsStringAsync(resolvedUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      body = base64ToArrayBuffer(base64);
    } catch {
      if (isTempCopy) {
        await FileSystem.deleteAsync(resolvedUri, { idempotent: true });
      }
      throw new Error(
        "Could not read video file. Ensure the recording completed and try again."
      );
    }
  }

  if (isTempCopy) {
    await FileSystem.deleteAsync(resolvedUri, { idempotent: true });
  }

  let lastError: Error | null = null;
  for (const bucket of BUCKETS_TO_TRY) {
    try {
      const { error } = await withTimeout(
        supabase.storage.from(bucket).upload(fileName, body, {
          contentType: "video/mp4",
          upsert: false
        }),
        UPLOAD_TIMEOUT_MS,
        "Upload timed out. Please check your connection and try again."
      );
      if (error) {
        lastError = error;
        continue;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error("Upload failed. Ensure the 'videos' or 'gait-videos' bucket exists and is public.");
}

export const FALLBACK_ANALYSIS: AIAnalysis = {
  postureScore: 75,
  symmetryScore: 82,
  keyInsights: [
    "Keep your shoulders relaxed.",
    "Try landing under your center of mass.",
    "Slight heel strike on left.",
  ],
  gaitPhases: [
    { timestamp: 0, phase: "Stance" },
    { timestamp: 0.4, phase: "Swing" },
    { timestamp: 0.5, phase: "Stance" },
    { timestamp: 0.9, phase: "Swing" },
  ],
  message: "AI is taking a breather. We'll update your posture score in a few minutes!",
};

export async function analyzeVideoWithGemini(videoUrl: string, userId?: string, testMode = false) {
  const invokePromise = supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl,
      userId: userId ?? undefined,
      testMode
    }
  });

  type InvokeResult = { data: unknown; error: unknown };
  let data: unknown;
  let error: unknown;
  try {
    const result = (await withTimeout(
      invokePromise,
      ANALYSIS_TIMEOUT_MS,
      "Analysis is taking longer than expected. Please check your connection and try again."
    )) as InvokeResult;
    data = result.data;
    error = result.error;
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("taking longer")) throw e;
    throw e;
  }

  if (error) {
    const msg = (error as { message?: string })?.message ?? "";
    if (msg.includes("429") || msg.includes("Rate limit")) {
      throw new Error("Rate limit reached. Please try again in a few minutes.");
    }
    throw new Error(msg || "Analysis failed. Please try again.");
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    const errMsg = String(data.error);
    if (errMsg.includes("Rate limit") || errMsg.includes("429")) {
      throw new Error("Rate limit reached. Please try again in a few minutes.");
    }
    throw new Error(errMsg);
  }

  return data as AIAnalysis;
}

export async function createPost(params: {
  userId: string;
  videoUrl: string;
  caption: string;
  analysis: AIAnalysis;
  durationSeconds?: number;
  challengeId?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    user_id: params.userId,
    video_url: params.videoUrl,
    caption: params.caption,
    gait_score: params.analysis.postureScore,
    analysis_json: params.analysis,
    duration_seconds: params.durationSeconds ?? 120,
    challenge_id: params.challengeId ?? null
  });

  if (error) {
    throw error;
  }
}
