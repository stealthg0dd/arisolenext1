import { supabase } from "@/lib/supabase";
import { AIAnalysis } from "@/types/database";

export async function uploadVideo(videoUri: string, userId: string) {
  const fileName = `${userId}/${Date.now()}.mp4`;
  const response = await fetch(videoUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from("videos").upload(fileName, blob, {
    contentType: "video/mp4"
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function analyzeVideoWithGemini(videoUrl: string) {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl
    }
  });

  if (error) {
    throw error;
  }

  return data as AIAnalysis;
}

export async function createPost(params: {
  userId: string;
  videoUrl: string;
  caption: string;
  analysis: AIAnalysis;
}) {
  const { error } = await supabase.from("posts").insert({
    user_id: params.userId,
    video_url: params.videoUrl,
    caption: params.caption,
    ai_analysis: params.analysis
  });

  if (error) {
    throw error;
  }
}
