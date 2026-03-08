import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.gradientBg} />
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>Movement. Posture. Community.</Text>
        <Text style={styles.sub}>Scan your walk. Unlock your Aura Score.</Text>
        <Pressable
          style={styles.cta}
          onPress={() => router.push("/onboarding-survey")}
        >
          <Text style={styles.ctaText}>SCAN MY MOVEMENT</Text>
        </Pressable>
        <Pressable style={styles.signInLink} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.signInLinkText}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e14"
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32
  },
  logoWrap: {
    width: 160,
    height: 160,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 80,
    backgroundColor: "rgba(0, 255, 157, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 157, 0.3)"
  },
  logo: {
    width: 120,
    height: 120
  },
  tagline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 8
  },
  sub: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 48
  },
  cta: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00ff9d",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 280,
    alignItems: "center",
    shadowColor: "#00ff9d",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#00ff9d"
  },
  signInLink: {
    marginTop: 24
  },
  signInLinkText: {
    color: "#94a3b8",
    fontSize: 14
  }
});
