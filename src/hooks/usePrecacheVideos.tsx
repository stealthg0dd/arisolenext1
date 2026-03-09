import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

import { ONBOARDING_VIDEO_URLS } from "@/constants/config";

/**
 * Pre-caches a single video using expo-video VideoPlayer + VideoView.
 * Renders off-screen to trigger load without visible UI.
 */
function PrecachePlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.muted = true;
    p.loop = true;
  });
  return (
    <View style={styles.offScreen}>
      <VideoView player={player} style={styles.video} nativeControls={false} contentFit="cover" />
    </View>
  );
}

/**
 * Pre-caches onboarding videos. Mount in app root for early preload.
 */
export function OnboardingVideoPrecache() {
  return (
    <View style={styles.container} pointerEvents="none">
      {ONBOARDING_VIDEO_URLS.map((url) => (
        <PrecachePlayer key={url} url={url} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: -9999,
    top: 0,
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
  offScreen: {
    width: 1,
    height: 1,
  },
  video: {
    width: 1,
    height: 1,
  },
});
