import { supabase } from "@/lib/supabase";
import { Comment, FeedPost } from "@/types/database";

const PAGE_SIZE = 10;

export async function fetchFeed(cursor = 0, userId?: string) {
  const from = cursor;
  const to = cursor + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      video_url,
      caption,
      ai_analysis,
      likes_count,
      created_at,
      user_profiles!posts_user_id_fkey(id, username, avatar, level),
      likes!left(user_id)
    `
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const posts: FeedPost[] = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    video_url: row.video_url,
    caption: row.caption,
    ai_analysis: row.ai_analysis,
    likes_count: row.likes_count,
    created_at: row.created_at,
    author: {
      id: row.user_profiles.id,
      username: row.user_profiles.username,
      avatar: row.user_profiles.avatar,
      level: row.user_profiles.level
    },
    isLikedByMe: (row.likes ?? []).some((like: { user_id: string }) => like.user_id === userId)
  }));

  return {
    posts,
    nextCursor: posts.length < PAGE_SIZE ? null : cursor + PAGE_SIZE
  };
}

export async function toggleLike(postId: string, userId: string, alreadyLiked: boolean) {
  if (alreadyLiked) {
    const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  if (error) {
    throw error;
  }
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, user_id, post_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []) as Comment[];
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select("id, user_id, post_id, content, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as Comment;
}

export function subscribeToFeedRealtime(onChange: () => void) {
  const channel = supabase
    .channel("feed-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "likes" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
