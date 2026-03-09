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

export async function uploadVideo(videoUri: string, userId: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}.mp4`;

  let body: Blob | ArrayBuffer;
  try {
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    body = base64ToArrayBuffer(base64);
  } catch {
    try {
      const response = await fetch(videoUri);
      body = await response.blob();
    } catch (e) {
      throw new Error("Could not read video file. Please try again.");
    }
  }

  const uploadPromise = (async () => {
    const { error } = await supabase.storage.from("gait-videos").upload(fileName, body, {
      contentType: "video/mp4"
    });
    if (error) throw error;
  })();

  try {
    await withTimeout(
      uploadPromise,
      UPLOAD_TIMEOUT_MS,
      "Upload timed out. Please check your connection and try again."
    );
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("timed out")) throw e;
    throw e;
  }

  const { data } = supabase.storage.from("gait-videos").getPublicUrl(fileName);
  return data.publicUrl;
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
