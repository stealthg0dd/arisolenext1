import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Colors, FontFamily } from "@/constants/Colors";

/**
 * Ghost outline overlay showing where to stand for optimal gait analysis.
 * Position feet within the silhouette for best AI detection.
 */
export function PoseGuideOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 200 320" preserveAspectRatio="xMidYMid meet">
        {/* Ghost outline: head, body, legs */}
        <Path
          d="M100 25 C118 25 132 42 132 68 L132 115 C132 138 116 155 100 155 C84 155 68 138 68 115 L68 68 C68 42 82 25 100 25 Z M72 155 L72 295 C72 312 85 320 100 320 C115 320 128 312 128 295 L128 155 M88 210 L88 295 M112 210 L112 295"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 6"
        />
      </Svg>
      <Text style={styles.hint}>Stand here for best gait analysis</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    bottom: 24,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
