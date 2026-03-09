import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

export default function CalibrationStep1Screen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 1: Placement</Text>
      <Text style={styles.subtitle}>
        Place your Arisole Smart Insoles inside your shoes. Ensure they&apos;re snug and aligned.
      </Text>
      <View style={styles.illustration}>
        <Ionicons name="footsteps" size={80} color={Colors.primary} />
      </View>
      <Pressable style={styles.button} onPress={() => router.push("/calibration/step2")}>
        <Text style={styles.buttonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40
  },
  illustration: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
