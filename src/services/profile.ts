import { supabase } from "@/lib/supabase";
import { Post, UserProfile } from "@/types/database";

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar, streak_days, points, level, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}

export async function fetchMyPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, video_url, caption, ai_analysis, likes_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Post[];
}
