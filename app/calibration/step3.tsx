import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

export default function CalibrationStep3Screen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.accent} />
      </View>
      <Text style={styles.title}>Calibration Complete</Text>
      <Text style={styles.subtitle}>
        Your insoles are ready. Start recording to see your plantar pressure data.
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace("/(tabs)/record")}>
        <Text style={styles.buttonText}>Start Recording</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 120,
    alignItems: "center"
  },
  iconWrap: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40,
    textAlign: "center"
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
