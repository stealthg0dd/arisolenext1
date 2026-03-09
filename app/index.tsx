/**
 * Arisole Landing Page - Stitch UI (ID: 4ee1aa0380ad4370bba1c18bc924bfb1)
 * Matches Stitch design: glass header, hero, CTA, feature icons, bottom nav
 */
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5DMVLOXIxmOm60jStuH4vxDwcqTbs3W_IcUaE-iNy6kfDwKDjB0L4JQ_I-TSMWguqXp8HaZyE0TZGrfw3epa1jQPhpVsPej3G1_Q4GCRDIkxtSZAIGyOdS_VbAf5x-S_an3rkauJycHUwkpvQjl1TfB2pw470clkaNG_f5LXcjYlAhgDysxxA75TG_OitQoaduw6zJTMxsUwLS_9wRIO4JA3Rf1XbiEH1jjYK03ozuvd2lNzDYjnc2aaV02ZrgVSfA_Jmnb0hoA";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Glass Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={80} tint="dark" style={styles.glassHeader}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Image source={require("../assets/images/logo.png")} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={styles.brand}>Arisole</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.aiBadge}>
                <View style={styles.aiDot} />
                <Text style={styles.aiBadgeText}>AI Live</Text>
              </View>
              <Pressable hitSlop={12}>
                <Ionicons name="menu" size={24} color={Colors.text} />
              </Pressable>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Perfect Your{"\n"}
            <Text style={styles.heroForm}>Form.</Text>{"\n"}
            <Text style={styles.heroAI}>Powered by AI.</Text>
          </Text>
          <Text style={styles.heroSub}>
            Real-time gait analysis to optimize performance and prevent injury.
          </Text>
        </View>

        {/* Hero Image */}
        <View style={styles.heroImageWrap}>
          <View style={styles.heroGradient} />
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.analyzingBadge}>
            <View style={styles.analyzingDot} />
            <Text style={styles.analyzingText}>Analyzing Motion</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push("/onboarding/goal")}
          >
            <Text style={styles.ctaText}>Analyze My Gait — Free</Text>
            <Ionicons name="flash" size={22} color={Colors.accent} />
          </Pressable>

          <Pressable style={styles.signInLink} onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={styles.signInText}>Already have an account? Sign in</Text>
          </Pressable>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="analytics" size={24} color={Colors.primary} />
              <Text style={styles.featureLabel}>Pro Metrics</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.feature}>
              <Ionicons name="fitness" size={24} color={Colors.primary} />
              <Text style={styles.featureLabel}>Injury Prevention</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.feature}>
              <Ionicons name="flash" size={24} color={Colors.primary} />
              <Text style={styles.featureLabel}>Instant Feedback</Text>
            </View>
          </View>
        </View>

        {/* Footer Banner */}
        <View style={styles.footerBanner}>
          <View style={styles.footerBannerRow}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.accent} />
            <Text style={styles.footerBannerText}>Day 1 of 30: Premium Trial Active</Text>
          </View>
          <Text style={styles.stripeText}>
            Secured by <Text style={styles.stripeBold}>Stripe</Text>
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <Ionicons name="home" size={28} color={Colors.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push("/(tabs)")}>
          <Ionicons name="stats-chart" size={28} color={Colors.textMuted} />
          <Text style={styles.navLabel}>Analysis</Text>
        </Pressable>
        <Pressable
          style={styles.navRecord}
          onPress={() => router.push("/(tabs)/record")}
        >
          <Ionicons name="videocam" size={32} color="white" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push("/(tabs)")}>
          <Ionicons name="trending-up" size={28} color={Colors.textMuted} />
          <Text style={styles.navLabel}>Progress</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push("/(auth)/sign-in")}>
          <Ionicons name="person-circle" size={28} color={Colors.textMuted} />
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  glassHeader: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,157,0.1)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(131,17,212,0.2)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 32,
    height: 32,
  },
  brand: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,255,157,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  hero: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    lineHeight: 1,
    letterSpacing: -0.5,
  },
  heroForm: {
    color: Colors.primary,
    fontStyle: "italic",
  },
  heroAI: {
    color: Colors.accent,
  },
  heroSub: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 16,
    maxWidth: 280,
  },
  heroImageWrap: {
    width: "100%",
    height: 288,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 40,
    position: "relative",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  analyzingBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  analyzingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  analyzingText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    textTransform: "uppercase",
  },
  ctaSection: {
    marginTop: 24,
  },
  signInLink: {
    marginTop: 20,
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 20,
    paddingHorizontal: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaText: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: "white",
  },
  features: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 24,
    opacity: 0.6,
  },
  feature: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  featureLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  featureDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  footerBanner: {
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerBannerText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  stripeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  stripeBold: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.extrabold,
  },
  bottomSpacer: { height: 80 },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: "rgba(10,14,20,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  navItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.primary,
  },
  navRecord: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
    borderWidth: 4,
    borderColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
