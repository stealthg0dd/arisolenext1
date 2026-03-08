import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRef, useState } from "react";
import { Alert, Dimensions, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { AIAnalysis, FeedPost } from "@/types/database";

type Props = {
  post: FeedPost;
  onLike: (post: FeedPost) => void;
  onCommentPress: (post: FeedPost) => void;
};

const CARD_WIDTH = Math.min(Dimensions.get("window").width - 28, 320);

function AuraCardContent({ analysis, username }: { analysis: AIAnalysis; username: string }) {
  const hypeQuote = analysis.message || "Your movement tells your story.";
  return (
    <View style={auraCardStyles.card}>
      <View style={auraCardStyles.glow} />
      <Text style={auraCardStyles.logo}>ARISOLE</Text>
      <Text style={auraCardStyles.label}>AURA SCORE</Text>
      <Text style={auraCardStyles.score}>{analysis.postureScore}</Text>
      <Text style={auraCardStyles.quote}>"{hypeQuote}"</Text>
      <Text style={auraCardStyles.handle}>@{username}</Text>
    </View>
  );
}

export function FeedVideoCard({ post, onLike, onCommentPress }: Props) {
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  const player = useVideoPlayer(post.video_url, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  const onShareToStory = async () => {
    if (!post.ai_analysis) {
      Alert.alert("No analysis", "This post has no AI analysis to share.");
      return;
    }
    setSharing(true);
    try {
      const capture = viewShotRef.current?.capture;
      const uri = capture ? await capture.call(viewShotRef.current) : null;
      if (uri) {
        await Share.share({ url: uri, message: `My Aura Score: ${post.ai_analysis.postureScore}` });
      }
    } catch (e) {
      Alert.alert("Share failed", (e as Error).message);
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

      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {post.ai_analysis && (
        <View style={styles.aiRow}>
          <View style={styles.aiBox}>
            <Text style={styles.aiHeadline}>Posture {post.ai_analysis.postureScore}/100</Text>
            <Text style={styles.aiMessage}>{post.ai_analysis.message}</Text>
          </View>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1, width: CARD_WIDTH, height: Math.round(CARD_WIDTH * 1.2) }}
            style={styles.hiddenShot}
          >
            <AuraCardContent analysis={post.ai_analysis} username={post.author.username} />
          </ViewShot>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => onLike(post)}>
          <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={22} color={post.isLikedByMe ? "#E11D48" : "#111827"} />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => onCommentPress(post)}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#111827" />
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>

        {post.ai_analysis && (
          <Pressable style={styles.actionButton} onPress={onShareToStory} disabled={sharing}>
            <Ionicons name="share-social-outline" size={22} color="#116530" />
            <Text style={[styles.actionText, styles.shareText]}>{sharing ? "..." : "Share to Story"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  username: {
    fontWeight: "700",
    color: "#111827"
  },
  level: {
    color: "#116530",
    fontWeight: "700"
  },
  video: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden"
  },
  caption: {
    marginTop: 8,
    color: "#374151"
  },
  aiRow: {
    marginTop: 8,
    position: "relative"
  },
  aiBox: {
    backgroundColor: "#ECFDF3",
    borderRadius: 10,
    padding: 10
  },
  aiHeadline: {
    fontWeight: "700",
    color: "#0E3B1E"
  },
  aiMessage: {
    color: "#1F2937",
    marginTop: 2
  },
  hiddenShot: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    opacity: 0,
    pointerEvents: "none"
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 18,
    flexWrap: "wrap"
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  actionText: {
    color: "#111827",
    fontWeight: "600"
  },
  shareText: {
    color: "#116530"
  }
});

const auraCardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#0a0e14",
    borderWidth: 2,
    borderColor: "#00ff9d",
    alignItems: "center",
    overflow: "hidden"
  },
  glow: {
    position: "absolute",
    top: -60,
    width: CARD_WIDTH + 40,
    height: 120,
    backgroundColor: "#00ff9d",
    opacity: 0.15,
    borderRadius: 60
  },
  logo: {
    fontSize: 14,
    letterSpacing: 6,
    color: "#00ff9d",
    fontWeight: "800",
    marginBottom: 8
  },
  label: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#6b7280",
    marginBottom: 4
  },
  score: {
    fontSize: 52,
    fontWeight: "800",
    color: "#00ff9d",
    marginBottom: 12
  },
  quote: {
    fontSize: 14,
    color: "#e5e7eb",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 12
  },
  handle: {
    fontSize: 12,
    color: "#00ff9d",
    fontWeight: "700"
  }
});
