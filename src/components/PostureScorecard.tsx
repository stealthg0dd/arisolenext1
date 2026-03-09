import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";
import { useVideoPlayer, VideoView } from "expo-video";

import { Colors, FontFamily } from "@/constants/Colors";
import { APP_STORE_URL } from "@/constants/config";
import type { FeedPost } from "@/types/database";

const SCORECARD_WIDTH = Math.min(Dimensions.get("window").width - 32, 360);
const SCORECARD_HEIGHT = Math.round(SCORECARD_WIDTH * 1.4);

type Props = {
  post: FeedPost;
  viewShotRef: React.RefObject<ViewShot | null>;
};

export function PostureScorecardContent({ post, viewShotRef }: Props) {
  const analysis = post.analysis_json;
  const score = post.gait_score ?? analysis?.postureScore ?? 0;
  const message = analysis?.message ?? "Your movement tells your story.";

  const player = useVideoPlayer(post.video_url, (p) => {
    p.loop = false;
    p.muted = true;
    p.currentTime = 0;
  });

  return (
    <ViewShot
      ref={viewShotRef}
      options={{
        format: "png",
        quality: 1,
        width: SCORECARD_WIDTH,
        height: SCORECARD_HEIGHT,
      }}
      style={styles.hidden}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>ARISOLE</Text>
          <Text style={styles.tagline}>Posture Scorecard</Text>
        </View>

        <View style={styles.thumbnailWrap}>
          <VideoView
            player={player}
            style={styles.thumbnail}
            nativeControls={false}
            contentFit="cover"
          />
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>AI Posture Score</Text>
          <Text style={styles.scoreValue}>{score}%</Text>
          <Text style={styles.quote} numberOfLines={2}>
            "{message}"
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.handle}>@{post.author.username}</Text>
          <QRCode value={APP_STORE_URL} size={64} color={Colors.text} backgroundColor={Colors.surfaceCard} />
        </View>
      </View>
    </ViewShot>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    left: -9999,
    top: 0,
    width: SCORECARD_WIDTH,
    height: SCORECARD_HEIGHT,
    opacity: 0,
    pointerEvents: "none",
  },
  card: {
    width: SCORECARD_WIDTH,
    height: SCORECARD_HEIGHT,
    backgroundColor: Colors.background,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: 20,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  logo: {
    fontSize: 18,
    letterSpacing: 4,
    color: Colors.accent,
    fontFamily: FontFamily.extrabold,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginTop: 4,
  },
  thumbnailWrap: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.surfaceCard,
    marginBottom: 16,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
  },
  quote: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  handle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.accent,
  },
});
