// Primary: Gemini. Fallback: Anthropic → OpenAI. All return { postureScore, insights, message }.
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type AnalysisResult = {
  postureScore: number;
  insights: string[];
  message: string;
};

const DEFAULT_RESULT: AnalysisResult = {
  postureScore: 75,
  insights: ["Keep your shoulders relaxed.", "Try landing under your center of mass."],
  message: "Great consistency today. Keep your cadence steady and stay relaxed."
};

const JSON_PROMPT = `Return JSON only with this exact shape (no markdown):
{
  "postureScore": number (0-100),
  "insights": string[] (2-4 short items),
  "message": string (positive, specific)
}`;

function parseJsonResponse(text: string): AnalysisResult | null {
  const normalized = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(normalized) as AnalysisResult;
    if (typeof parsed.postureScore !== "number" || !Array.isArray(parsed.insights) || typeof parsed.message !== "string") {
      return null;
    }
    return {
      postureScore: Math.max(0, Math.min(100, parsed.postureScore)),
      insights: Array.isArray(parsed.insights) ? parsed.insights : DEFAULT_RESULT.insights,
      message: String(parsed.message || DEFAULT_RESULT.message)
    };
  } catch {
    return null;
  }
}

async function tryGemini(videoUrl: string): Promise<AnalysisResult | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are an encouraging running and walking coach. Analyze the athlete movement from the provided video URL. ${JSON_PROMPT}`;
  const result = await model.generateContent([prompt, `video_url: ${videoUrl}`]);
  const text = result.response.text().trim();
  return parseJsonResponse(text);
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
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoUrl is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    return new Response(JSON.stringify({ ...out, _source: source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ...DEFAULT_RESULT, error: (error as Error).message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
