import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { ArisoleFeedCard } from "@/components/ArisoleFeedCard";
import { ChallengesSection } from "@/components/ChallengesSection";
import { CommentModal } from "@/components/CommentModal";
import { Colors, FontFamily } from "@/constants/Colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchFeed, subscribeToFeedRealtime, toggleLike } from "@/services/feed";
import { FeedPost } from "@/types/database";

export default function FeedScreen() {
  const { session } = useAuth();
  const router = useRouter();
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

  const onAnalysisPress = useCallback(
    (post: FeedPost) => router.push(`/analysis/${post.id}` as any),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <ArisoleFeedCard
        post={item}
        onLike={onLike}
        onCommentPress={setActivePost}
        onAnalysisPress={onAnalysisPress}
      />
    ),
    [onLike, onAnalysisPress]
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
        <Text style={styles.header}>Arisole Feed</Text>
        <Text style={styles.subheader}>Today&apos;s movement</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storyScroll}
          contentContainerStyle={styles.storyContent}
        >
          <View style={styles.storyAvatar}>
            <Text style={styles.storyAvatarText}>+</Text>
          </View>
          {posts.slice(0, 4).map((p) => (
            <View key={p.id} style={styles.storyAvatar}>
              <Text style={styles.storyAvatarText}>
                {p.author.username?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          ))}
        </ScrollView>
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
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  subheader: {
    marginHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  storyScroll: {
    marginBottom: 12,
  },
  storyContent: {
    paddingHorizontal: 14,
    gap: 12,
    paddingRight: 28,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarText: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.accent,
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
