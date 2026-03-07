import { supabase } from "@/lib/supabase";
import { Challenge, ChallengeParticipant } from "@/types/database";

export async function fetchActiveChallenges() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("challenges")
    .select("id, name, type, start_date, end_date, prize, created_at")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Challenge[];
}

export async function fetchChallengeLeaderboard(challengeId: string) {
  const { data, error } = await supabase
    .from("challenge_participants")
    .select("id, challenge_id, user_id, score, rank, created_at, user_profiles!challenge_participants_user_id_fkey(username)")
    .eq("challenge_id", challengeId)
    .order("score", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    ...(row as ChallengeParticipant),
    username: row.user_profiles?.username ?? "Runner"
  })) as Array<ChallengeParticipant & { username: string }>;
}
