import { supabase } from "@/lib/supabase";
import { Post, UserProfile } from "@/types/database";

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar, streak_days, points, level, created_at, referral_code, referral_count, user_interests, is_premium")
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
    .select("id, user_id, video_url, caption, gait_score, analysis_json, likes_count, created_at, duration_seconds")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Post[];
}

export async function updateOnboardingProfile(
  userId: string,
  data: {
    onboarding_goal?: string | null;
    onboarding_activity_level?: string | null;
    onboarding_smart_insoles?: string | null;
    user_interests?: string[];
  }
) {
  const { error } = await supabase
    .from("user_profiles")
    .update(data)
    .eq("id", userId);

  if (error) throw error;
}
