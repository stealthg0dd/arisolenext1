import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

export default function AuthGateScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
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
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
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
    fontSize: 14
  }
});
