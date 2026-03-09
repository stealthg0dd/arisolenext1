export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GaitPhase = "Stance" | "Swing";

export type AIAnalysis = {
  postureScore: number;
  symmetryScore?: number;
  keyInsights?: string[];
  gaitPhases?: { timestamp: number; phase: GaitPhase }[];
  /** @deprecated Use keyInsights */
  insights?: string[];
  message: string;
};

export type UserProfile = {
  id: string;
  username: string;
  avatar: string | null;
  streak_days: number;
  points: number;
  level: number;
  created_at: string;
  referral_code?: string | null;
  referral_count?: number;
  user_interests?: string[] | null;
  is_premium?: boolean;
  expo_push_token?: string | null;
};

export type Post = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  gait_score: number | null;
  analysis_json: AIAnalysis | null;
  likes_count: number;
  created_at: string;
  duration_seconds?: number | null;
  challenge_id?: string | null;
};

export type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
};

export type DailyCheckIn = {
  id: string;
  user_id: string;
  date: string;
  feeling_score: number;
  shoe_type: string;
  activity: "walk" | "run";
  created_at: string;
};

export type Challenge = {
  id: string;
  name: string;
  type: "distance" | "streak" | "consistency";
  start_date: string;
  end_date: string;
  prize: string;
  created_at: string;
};

export type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  user_id: string;
  score: number;
  rank: number | null;
  created_at: string;
};

export type FeedPost = Post & {
  author: Pick<UserProfile, "id" | "username" | "avatar" | "level">;
  isLikedByMe: boolean;
  challenge?: { id: string; name: string } | null;
};
