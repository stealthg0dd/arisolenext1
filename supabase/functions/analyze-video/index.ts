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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const { videoUrl } = await req.json();
    if (!videoUrl) {
      throw new Error("videoUrl is required.");
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an encouraging running and walking coach.
Analyze the athlete movement from the provided video URL.
Return JSON only with this shape:
{
  "postureScore": number (0-100),
  "insights": string[],
  "message": string
}
Guidelines:
- Keep message positive and specific.
- Give 2-4 short insights.
- Do not include markdown.`;

    const result = await model.generateContent([
      prompt,
      `video_url: ${videoUrl}`
    ]);

    const response = result.response.text().trim();

    const normalized = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(normalized) as AnalysisResult;

    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        postureScore: 75,
        insights: ["Keep your shoulders relaxed.", "Try landing under your center of mass."],
        message: "Great consistency today. Keep your cadence steady and stay relaxed.",
        error: (error as Error).message
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
