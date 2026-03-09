import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, FontFamily } from "@/constants/Colors";

type Props = {
  isDark: boolean;
};

/**
 * Shows a warning when environment is too dark for optimal AI analysis.
 * Real implementation would use camera frame brightness analysis.
 */
export function LightingCheck({ isDark }: Props) {
  if (!isDark) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
      <Text style={styles.text}>Brighter light helps the AI see you better!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  text: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: "#B45309",
  },
});
