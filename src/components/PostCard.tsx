import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { FeedPost } from "@/types/database";

type Props = {
  post: FeedPost;
  onLike: (post: FeedPost) => void;
  onCommentPress: (post: FeedPost) => void;
};

export function PostCard({ post, onLike, onCommentPress }: Props) {
  const analysis = post.analysis_json ?? (post as { ai_analysis?: { postureScore: number; message?: string } }).ai_analysis;
  const score = post.gait_score ?? analysis?.postureScore;

  const player = useVideoPlayer(post.video_url, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>@{post.author.username}</Text>
        <Text style={styles.level}>Lvl {post.author.level}</Text>
      </View>

      <VideoView player={player} style={styles.video} nativeControls={false} contentFit="cover" />

      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {analysis && (
        <View style={styles.aiBox}>
          <Text style={styles.aiHeadline}>Posture {score ?? analysis.postureScore}/100</Text>
          <Text style={styles.aiMessage}>{analysis.message}</Text>
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
  aiBox: {
    marginTop: 8,
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
  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 18
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  actionText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.semibold
  }
});
