import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

export default function AuthGateScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.card}>
        <Ionicons name="lock-closed" size={64} color={Colors.primary} />
        <Text style={styles.title}>Sign in to unlock</Text>
        <Text style={styles.subtitle}>
          Your analysis is ready. Sign in to save your posture score and share with the community.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 16
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  },
  link: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
});
