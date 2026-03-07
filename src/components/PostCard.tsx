import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FeedPost } from "@/types/database";

type Props = {
  post: FeedPost;
  onLike: (post: FeedPost) => void;
  onCommentPress: (post: FeedPost) => void;
};

export function PostCard({ post, onLike, onCommentPress }: Props) {
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

      {post.ai_analysis && (
        <View style={styles.aiBox}>
          <Text style={styles.aiHeadline}>Posture {post.ai_analysis.postureScore}/100</Text>
          <Text style={styles.aiMessage}>{post.ai_analysis.message}</Text>
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
  aiBox: {
    marginTop: 8,
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
    color: "#111827",
    fontWeight: "600"
  }
});
