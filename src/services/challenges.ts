import { supabase } from "@/lib/supabase";
import { Challenge, ChallengeParticipant } from "@/types/database";

export type LeaderboardEntry = ChallengeParticipant & {
  username: string;
  avatar: string | null;
  avgPosture: number | null;
};

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
    .select("id, challenge_id, user_id, score, rank, created_at, user_profiles!challenge_participants_user_id_fkey(username, avatar)")
    .eq("challenge_id", challengeId)
    .order("score", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    ...(row as ChallengeParticipant),
    username: row.user_profiles?.username ?? "Runner",
    avatar: row.user_profiles?.avatar ?? null
  })) as Array<ChallengeParticipant & { username: string; avatar: string | null }>;
}

export async function fetchLeaderboardWithAvgPosture(
  challengeId: string,
  startDate: string,
  endDate: string,
  limit = 3
): Promise<LeaderboardEntry[]> {
  const base = await fetchChallengeLeaderboard(challengeId);
  const top = base.slice(0, limit);

  const withPosture: LeaderboardEntry[] = await Promise.all(
    top.map(async (entry) => {
      const { data: posts } = await supabase
        .from("posts")
        .select("gait_score, analysis_json")
        .eq("user_id", entry.user_id)
        .gte("created_at", `${startDate}T00:00:00Z`)
        .lte("created_at", `${endDate}T23:59:59Z`);

      let avgPosture: number | null = null;
      if (posts && posts.length > 0) {
        const scores = posts
          .map((p) => p.gait_score ?? (p.analysis_json as { postureScore?: number })?.postureScore)
          .filter((s): s is number => typeof s === "number");
        if (scores.length > 0) {
          avgPosture = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
      }

      return {
        ...entry,
        avgPosture
      };
    })
  );

  return withPosture;
}

/**
 * Subscribes to challenge leaderboard changes. Returns an unsubscribe function.
 * Call the returned function when the component unmounts to prevent memory leaks.
 */
export function subscribeToChallengeLeaderboard(
  challengeId: string,
  onUpdate: () => void
): () => void {
  const channel = supabase.channel(`leaderboard:${challengeId}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "challenge_participants",
      filter: `challenge_id=eq.${challengeId}`
    },
    onUpdate
  );
  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
