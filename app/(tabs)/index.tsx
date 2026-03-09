import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";

import { ArisoleFeedCard } from "@/components/ArisoleFeedCard";
import { ChallengesSection } from "@/components/ChallengesSection";
import { CommentModal } from "@/components/CommentModal";
import { Colors, FontFamily, FontWeights } from "@/constants/Colors";
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
  const [schemaError, setSchemaError] = useState(false);

  const loadInitial = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setSchemaError(false);
    try {
      const result = await fetchFeed(0, userId);
      setPosts(result.posts);
      setCursor(result.nextCursor);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "";
      if (msg.includes("schema cache") || msg.includes("PGRST205")) {
        setSchemaError(true);
      } else {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
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

  if (loading && !schemaError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (schemaError) {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={styles.schemaErrorTitle}>Database setup required</Text>
        <Text style={styles.schemaErrorText}>
          Run the schema in Supabase SQL Editor. See SETUP_SUPABASE.md for steps.
        </Text>
      </View>
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <ArisoleFeedCard post={item} onLike={onLike} onCommentPress={setActivePost} />
    ),
    [onLike]
  );

  const flashListProps = {
    data: posts,
    estimatedItemSize: 380,
    initialNumToRender: 5,
    maxToRenderPerBatch: 3,
    windowSize: 6,
    keyExtractor: (item: FeedPost) => item.id,
    renderItem,
    onEndReached: loadMore,
    onEndReachedThreshold: 0.3,
    refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
    ListHeaderComponent: (
      <View>
        <Text style={styles.header}>Today&apos;s movement</Text>
        <ChallengesSection />
      </View>
    ),
    ListFooterComponent: loadingMore ? (
      <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.accent} />
    ) : null,
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
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginTop: 12,
    marginHorizontal: 14,
    marginBottom: 2,
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  empty: {
    textAlign: "center",
    marginTop: 28,
    color: Colors.textMuted,
  },
  schemaErrorTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
  },
  schemaErrorText: {
    textAlign: "center",
    color: Colors.textMuted,
  },
});
