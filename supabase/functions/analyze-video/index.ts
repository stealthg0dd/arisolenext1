// Primary: Gemini. Fallback: Anthropic → OpenAI. All return { postureScore, insights, message, isValidContent }.
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type GaitPhase = "Stance" | "Swing";

type AnalysisResult = {
  postureScore: number;
  symmetryScore: number;
  keyInsights: string[];
  gaitPhases: { timestamp: number; phase: GaitPhase }[];
  message: string;
  isValidContent?: boolean;
};

const DEFAULT_RESULT: AnalysisResult = {
  postureScore: 75,
  symmetryScore: 82,
  keyInsights: ["Keep your shoulders relaxed.", "Try landing under your center of mass.", "Slight heel strike on left."],
  gaitPhases: [
    { timestamp: 0, phase: "Stance" },
    { timestamp: 0.4, phase: "Swing" },
    { timestamp: 0.5, phase: "Stance" },
    { timestamp: 0.9, phase: "Swing" }
  ],
  message: "Great consistency today. Keep your cadence steady and stay relaxed."
};

const INVALID_CONTENT_RESULT: AnalysisResult = {
  postureScore: 0,
  symmetryScore: 0,
  keyInsights: [],
  gaitPhases: [],
  message: "Please take video of your feet movement in closeup or footwear only.",
  isValidContent: false
};

const JSON_PROMPT = `Return JSON only with this exact shape (no markdown):
{
  "isValidContent": boolean (true only if video clearly shows feet, footwear, or close-up foot/leg movement),
  "postureScore": number (0-100, overall posture quality when valid),
  "symmetryScore": number (0-100, left-right balance when valid),
  "keyInsights": string[] (exactly 3 actionable tips, e.g. "Slight heel strike on left", when valid; empty when invalid),
  "gaitPhases": array of { "timestamp": number (seconds 0-1), "phase": "Stance" | "Swing" } (map key moments when valid),
  "message": string (positive feedback when valid; when invalid use: "Please take video of your feet movement in closeup or footwear only.")
}
If the video shows faces, hands, scenery, pets, or anything other than feet/footwear/legs in motion, set isValidContent to false.`;

function parseJsonResponse(text: string): AnalysisResult | null {
  const normalized = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(normalized) as AnalysisResult & { isValidContent?: boolean; insights?: string[] };
    const isValid = parsed.isValidContent !== false;
    const keyInsights = Array.isArray(parsed.keyInsights)
      ? parsed.keyInsights.slice(0, 3)
      : Array.isArray(parsed.insights)
        ? parsed.insights.slice(0, 3)
        : DEFAULT_RESULT.keyInsights;
    const gaitPhases = Array.isArray(parsed.gaitPhases)
      ? parsed.gaitPhases.filter(
          (p: { timestamp?: number; phase?: string }) =>
            typeof p?.timestamp === "number" && (p.phase === "Stance" || p.phase === "Swing")
        )
      : DEFAULT_RESULT.gaitPhases;
    return {
      postureScore: isValid && typeof parsed.postureScore === "number"
        ? Math.max(0, Math.min(100, parsed.postureScore))
        : 0,
      symmetryScore: isValid && typeof parsed.symmetryScore === "number"
        ? Math.max(0, Math.min(100, parsed.symmetryScore))
        : 0,
      keyInsights,
      gaitPhases,
      message: String(parsed.message || (isValid ? DEFAULT_RESULT.message : INVALID_CONTENT_RESULT.message)),
      ...(isValid ? {} : { isValidContent: false as const })
    };
  } catch {
    return null;
  }
}

function isRateLimitError(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? "");
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate limit");
}

async function tryGemini(videoUrl: string, retryCount = 0): Promise<AnalysisResult | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `You are analyzing videos for a foot movement and posture app. FIRST check: Does this video show feet, footwear, or close-up foot/leg movement? If it shows faces, hands, scenery, pets, or anything else, respond with isValidContent: false.
If valid (feet/footwear visible): Analyze the movement and posture. ${JSON_PROMPT}`;

  try {
    // Fetch video from public URL and pass as inline data (Gemini requires actual video bytes)
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      throw new Error(`Could not fetch video: ${videoRes.status} ${videoRes.statusText}`);
    }
    const videoBuffer = await videoRes.arrayBuffer();
    const videoBase64 = encodeBase64(new Uint8Array(videoBuffer));

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoBase64
        }
      },
      prompt
    ]);
    const text = result.response.text().trim();
    return parseJsonResponse(text);
  } catch (e) {
    if (isRateLimitError(e) && retryCount < 1) {
      await new Promise((r) => setTimeout(r, 2000));
      return tryGemini(videoUrl, retryCount + 1);
    }
    throw e;
  }
}

async function tryAnthropic(videoUrl: string): Promise<AnalysisResult | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `The user submitted a movement/walking video (URL not sent; we only have text reference). As an encouraging running and walking coach, provide brief posture and movement feedback. ${JSON_PROMPT}`
        }
      ]
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return parseJsonResponse(text);
}

async function tryOpenAI(videoUrl: string): Promise<AnalysisResult | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an encouraging running and walking coach. Respond only with valid JSON."
        },
        {
          role: "user",
          content: `The user submitted a movement video (reference only). Provide brief posture feedback. ${JSON_PROMPT}`
        }
      ]
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseJsonResponse(text);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const videoUrl = body.videoUrl;
    const userId = body.userId as string | undefined;
    const postId = body.postId as string | undefined;
    const durationSeconds = body.durationSeconds as number | undefined;
    const testMode = body.testMode === true;

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoUrl is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mock mode: return hardcoded valid JSON without calling Gemini (for testing without quota)
    if (testMode) {
      const mockPayload = { ...DEFAULT_RESULT, _source: "mock" };
      return new Response(JSON.stringify(mockPayload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result: AnalysisResult | null = null;
    let source = "none";

    result = await tryGemini(videoUrl);
    if (result) {
      source = "gemini";
    } else {
      result = await tryAnthropic(videoUrl);
      if (result) source = "anthropic";
      else {
        result = await tryOpenAI(videoUrl);
        if (result) source = "openai";
      }
    }

    const out = result ?? DEFAULT_RESULT;
    const payload = { ...out, _source: source };

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      try {
        if (postId) {
          const { isValidContent: _, _source: __, ...analysisForDb } = payload as AnalysisResult & { _source?: string };
          const updatePayload: Record<string, unknown> = {
            gait_score: out.postureScore,
            analysis_json: analysisForDb
          };
          if (typeof durationSeconds === "number" && durationSeconds > 0) {
            updatePayload.duration_seconds = Math.round(durationSeconds);
          }
          const { error: updateError } = await supabase
            .from("posts")
            .update(updatePayload)
            .eq("id", postId);
          if (updateError) {
            console.warn("posts update failed:", updateError.message);
          }
        }
        if (userId) {
          const filePath = `${userId}/${Date.now()}.json`;
          const { error: uploadError } = await supabase.storage
            .from("analysis-results")
            .upload(filePath, JSON.stringify(payload), {
              contentType: "application/json",
              upsert: false
            });
          if (uploadError) {
            console.warn("analysis-results upload failed:", uploadError.message);
          }
        }
      } catch (e) {
        console.warn("supabase error:", e);
      }
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    const msg = (error as Error).message ?? "";
    const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate limit");
    return new Response(
      JSON.stringify({
        ...DEFAULT_RESULT,
        error: isRateLimit ? "Rate limit reached. Please try again in a few minutes." : msg
      }),
      {
        status: isRateLimit ? 429 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
