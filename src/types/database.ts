export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AIAnalysis = {
  postureScore: number;
  insights: string[];
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
};

export type Post = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  ai_analysis: AIAnalysis | null;
  likes_count: number;
  created_at: string;
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
};
