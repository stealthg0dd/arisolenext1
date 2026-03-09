import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRef, useState } from "react";
import { Alert, Dimensions, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
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

  const analysis = post.analysis_json ?? (post as { ai_analysis?: { postureScore: number; message?: string } }).ai_analysis;
  const score = post.gait_score ?? analysis?.postureScore;

  const onShareToStory = async () => {
    if (!analysis) {
      Alert.alert("No analysis", "This post has no AI analysis to share.");
      return;
    }
    setSharing(true);
    try {
      const capture = viewShotRef.current?.capture;
      const uri = capture ? await capture.call(viewShotRef.current) : null;
      if (uri) {
        await Share.share({ url: uri, message: `My Aura Score: ${score ?? analysis.postureScore}` });
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

      {analysis && (
        <View style={styles.aiRow}>
          <View style={styles.aiBox}>
            <Text style={styles.aiHeadline}>Posture {score ?? analysis.postureScore}/100</Text>
            <Text style={styles.aiMessage}>{analysis.message}</Text>
          </View>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1, width: CARD_WIDTH, height: Math.round(CARD_WIDTH * 1.2) }}
            style={styles.hiddenShot}
          >
            <AuraCardContent
              analysis={{
                postureScore: score ?? analysis.postureScore ?? 0,
                insights: (analysis as AIAnalysis).keyInsights ?? (analysis as AIAnalysis).insights ?? [],
                message: analysis.message ?? ""
              }}
              username={post.author.username}
            />
          </ViewShot>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => onLike(post)}>
          <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={22} color={post.isLikedByMe ? Colors.like : Colors.textSecondary} />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => onCommentPress(post)}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.textSecondary} />
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>

        {analysis && (
          <Pressable style={styles.actionButton} onPress={onShareToStory} disabled={sharing}>
            <Ionicons name="share-social-outline" size={22} color={Colors.accent} />
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
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  username: {
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  level: {
    color: Colors.accent,
    fontFamily: FontFamily.bold
  },
  video: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: "hidden"
  },
  caption: {
    marginTop: 8,
    color: Colors.textSecondary
  },
  aiRow: {
    marginTop: 8,
    position: "relative"
  },
  aiBox: {
    backgroundColor: "rgba(0,255,157,0.1)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.accent
  },
  aiHeadline: {
    fontFamily: FontFamily.bold,
    color: Colors.accent
  },
  aiMessage: {
    color: Colors.text,
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
    color: Colors.text,
    fontFamily: FontFamily.semibold
  },
  shareText: {
    color: Colors.accent
  }
});

const auraCardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: "center",
    overflow: "hidden"
  },
  glow: {
    position: "absolute",
    top: -60,
    width: CARD_WIDTH + 40,
    height: 120,
    backgroundColor: Colors.accent,
    opacity: 0.15,
    borderRadius: 60
  },
  logo: {
    fontSize: 14,
    letterSpacing: 6,
    color: Colors.accent,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8
  },
  label: {
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.textMuted,
    marginBottom: 4
  },
  score: {
    fontSize: 52,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
    marginBottom: 12
  },
  quote: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 12
  },
  handle: {
    fontSize: 12,
    color: Colors.accent,
    fontFamily: FontFamily.bold
  }
});
