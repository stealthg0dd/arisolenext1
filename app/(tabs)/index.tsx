import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";

import { CommentModal } from "@/components/CommentModal";
import { FeedVideoCard } from "@/components/FeedVideoCard";
import { useAuth } from "@/providers/AuthProvider";
import { fetchFeed, subscribeToFeedRealtime, toggleLike } from "@/services/feed";
import { FeedPost } from "@/types/database";

export default function FeedScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  const loadInitial = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    const result = await fetchFeed(0, userId);
    setPosts(result.posts);
    setCursor(result.nextCursor);
    setLoading(false);
  }, [userId]);

  const loadMore = async () => {
    if (!userId || cursor === null || loadingMore) {
      return;
    }

    setLoadingMore(true);
    const result = await fetchFeed(cursor, userId);
    setPosts((prev: FeedPost[]) => [...prev, ...result.posts]);
    setCursor(result.nextCursor);
    setLoadingMore(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const onLike = async (post: FeedPost) => {
    if (!userId) {
      return;
    }

    setPosts((prev: FeedPost[]) =>
      prev.map((item: FeedPost) => {
        if (item.id !== post.id) {
          return item;
        }

        const nowLiked = !item.isLikedByMe;
        return {
          ...item,
          isLikedByMe: nowLiked,
          likes_count: nowLiked ? item.likes_count + 1 : Math.max(0, item.likes_count - 1)
        };
      })
    );

    try {
      await toggleLike(post.id, userId, post.isLikedByMe);
    } catch {
      await loadInitial();
    }
  };

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let pending = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToFeedRealtime(() => {
      if (pending) {
        return;
      }

      pending = true;
      timeoutId = setTimeout(() => {
        pending = false;
        loadInitial();
      }, 500);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, [loadInitial, userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <FeedVideoCard post={item} onLike={onLike} onCommentPress={setActivePost} />
    ),
    [onLike]
  );

  const flashListProps = {
    data: posts,
    estimatedItemSize: 380,
    keyExtractor: (item: FeedPost) => item.id,
    renderItem,
    onEndReached: loadMore,
    onEndReachedThreshold: 0.3,
    refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
    ListHeaderComponent: <Text style={styles.header}>Today&apos;s movement</Text>,
    ListFooterComponent: loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null,
    ListEmptyComponent: <Text style={styles.empty}>No posts yet. Record your first walk.</Text>
  };

  return (
    <View style={styles.container}>
      <FlashList {...(flashListProps as any)} />

      <CommentModal open={!!activePost} post={activePost} userId={userId ?? ""} onClose={() => setActivePost(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F2"
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    marginTop: 12,
    marginHorizontal: 14,
    marginBottom: 2,
    fontSize: 22,
    fontWeight: "800",
    color: "#0E3B1E"
  },
  empty: {
    textAlign: "center",
    marginTop: 28,
    color: "#4B5563"
  }
});
