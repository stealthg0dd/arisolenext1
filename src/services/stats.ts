import { supabase } from "@/lib/supabase";

export type WellnessStats = {
  totalMovementMinutes: number;
  averagePosturePercent: number;
  winsCount: number;
  postureStreak: number;
};

const POSTURE_THRESHOLD = 70;

/**
 * Calculates Posture Streak: consecutive days with at least one video upload
 * where gait_score > 70%.
 */
function calculatePostureStreak(
  posts: { created_at: string; gait_score: number | null; analysis_json: unknown }[]
): number {
  const scoreByDate = new Map<string, number>();
  for (const p of posts) {
    const score = p.gait_score ?? (p.analysis_json as { postureScore?: number })?.postureScore;
    if (typeof score !== "number") continue;
    const date = p.created_at.slice(0, 10);
    const existing = scoreByDate.get(date);
    if (existing === undefined || score > existing) {
      scoreByDate.set(date, score);
    }
  }

  const qualifyingDates = [...scoreByDate.entries()]
    .filter(([, s]) => s > POSTURE_THRESHOLD)
    .map(([d]) => d)
    .sort()
    .reverse();

  if (qualifyingDates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const mostRecent = qualifyingDates[0];
  const diff = (new Date(today).getTime() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24);
  if (diff > 1) return 0;

  let streak = 1;
  let prev = mostRecent;
  for (let i = 1; i < qualifyingDates.length; i++) {
    const curr = qualifyingDates[i];
    const diffDays = (new Date(prev).getTime() - new Date(curr).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
      prev = curr;
    } else {
      break;
    }
  }
  return streak;
}

export const STREAK_MILESTONES = [3, 7, 30] as const;

/**
 * Calculates Total Movement Minutes, Average Posture %, and Posture Streak.
 */
export async function fetchWellnessStats(userId: string): Promise<WellnessStats> {
  const { data, error } = await supabase
    .from("posts")
    .select("gait_score, analysis_json, duration_seconds, created_at")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const posts = data ?? [];
  const totalMovementMinutes = posts.reduce((sum, p) => {
    const sec = p.duration_seconds ?? 120;
    return sum + Math.round(sec / 60);
  }, 0);

  const scores: number[] = [];
  for (const p of posts) {
    const score = p.gait_score ?? (p.analysis_json as { postureScore?: number })?.postureScore;
    if (typeof score === "number") {
      scores.push(score);
    }
  }
  const averagePosturePercent = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const postureStreak = calculatePostureStreak(posts);

  return {
    totalMovementMinutes,
    averagePosturePercent,
    winsCount: posts.length,
    postureStreak
  };
}
