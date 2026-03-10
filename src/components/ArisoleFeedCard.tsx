import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";

import { Colors, FontFamily, FontWeights } from "@/constants/Colors";
import { PostureScorecardContent } from "@/components/PostureScorecard";
import { useToast } from "@/contexts/ToastContext";
import { AIAnalysis, FeedPost } from "@/types/database";

type Props = {
  post: FeedPost;
  onLike: (post: FeedPost) => void;
  onCommentPress: (post: FeedPost) => void;
  onAnalysisPress?: (post: FeedPost) => void;
};

const CARD_WIDTH = Math.min(Dimensions.get("window").width - 28, 360);
const CARD_PADDING = 16;
const CARD_BORDER_RADIUS = 20;
const BADGE_BORDER_RADIUS = 12;

export function ArisoleFeedCard({ post, onLike, onCommentPress, onAnalysisPress }: Props) {
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  const toast = useToast();

  const player = useVideoPlayer(post.video_url, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  const analysis = post.analysis_json ?? (post as { ai_analysis?: AIAnalysis }).ai_analysis;
  /** AI Posture Score: prefers gait_score from Supabase, falls back to analysis_json.postureScore */
  const gaitScore = post.gait_score ?? analysis?.postureScore ?? null;

  const onShare = async () => {
    if (gaitScore === null && !analysis) {
      toast.showError("This post has no posture score to share.");
      return;
    }
    setSharing(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.showError("Sharing is not available on this device.");
        return;
      }
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Posture Scorecard",
        });
      }
    } catch (e) {
      toast.showError((e as Error).message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>@{post.author.username}</Text>
        <Text style={styles.level}>Lvl {post.author.level}</Text>
      </View>

      <VideoView player={player} style={styles.video} nativeControls={false} contentFit="cover" />

      {post.challenge && (
        <View style={styles.challengeBadge}>
          <Ionicons name="trophy" size={14} color={Colors.primaryLight} />
          <Text style={styles.challengeBadgeText}>{post.challenge.name}</Text>
        </View>
      )}

      {gaitScore !== null && (
        <Pressable
          style={styles.aiBadge}
          onPress={() => onAnalysisPress?.(post)}
        >
          <Ionicons name="sparkles" size={16} color={Colors.primaryLight} />
          <Text style={styles.aiBadgeText}>AI Posture Score: {gaitScore}%</Text>
        </Pressable>
      )}

      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => onLike(post)}>
          <Ionicons
            name={post.isLikedByMe ? "heart" : "heart-outline"}
            size={22}
            color={post.isLikedByMe ? Colors.like : Colors.textSecondary}
          />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => onCommentPress(post)}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.textSecondary} />
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onShare}
          disabled={sharing || (gaitScore === null && !analysis)}
        >
          <Ionicons name="share-social-outline" size={22} color={Colors.accent} />
          <Text style={[styles.actionText, styles.shareText]}>
            {sharing ? "..." : "Share"}
          </Text>
        </Pressable>
      </View>

      {gaitScore !== null && (
        <PostureScorecardContent post={post} viewShotRef={viewShotRef} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    padding: CARD_PADDING,
    borderRadius: CARD_BORDER_RADIUS,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  username: {
    fontFamily: FontFamily.bold,
    color: Colors.text,
    fontSize: 15,
  },
  level: {
    color: Colors.accent,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  video: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: "hidden",
  },
  challengeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  challengeBadgeText: {
    color: Colors.primaryLight,
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BADGE_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiBadgeText: {
    color: Colors.primaryLight,
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  caption: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    marginTop: 14,
    gap: 20,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  shareText: {
    color: Colors.accent,
  },
});
