import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { PlantarPressureChart } from "@/components/PlantarPressureChart";
import { ReferralShareCard } from "@/components/ReferralShareCard";
import { StreakMilestoneModal } from "@/components/StreakMilestoneModal";
import { Colors, FontFamily, FontWeights } from "@/constants/Colors";
import { WAITLIST_URL } from "@/constants/config";
import { useStreakMilestone } from "@/hooks/useStreakMilestone";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useSimulateInsole } from "@/providers/SimulateInsoleProvider";
import { fetchMyPosts, fetchMyProfile } from "@/services/profile";
import { fetchWellnessStats, type WellnessStats } from "@/services/stats";
import { Post, UserProfile } from "@/types/database";

const REFERRALS_NEEDED = 3;
const REFERRAL_BASE = "https://arisole.app";

function ProgressRing({
  value,
  max,
  size,
  strokeWidth,
  color
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, value / max);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.surfaceBorder}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<WellnessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const referralCount = profile?.referral_count ?? 0;
  const [copied, setCopied] = useState(false);
  const [developerMenuVisible, setDeveloperMenuVisible] = useState(false);
  const { showModal: showStreakModal, dismiss: dismissStreakModal } = useStreakMilestone(
    stats?.postureStreak ?? 0
  );
  const { simulateInsole, setSimulateInsole, simulateDark, setSimulateDark } = useSimulateInsole();
  const isPremium = profile?.is_premium === true;

  const router = useRouter();
  const onSettingsPress = useCallback(() => {
    router.push("/settings");
  }, [router]);
  const onSettingsLongPress = useCallback(() => {
    if (__DEV__) setDeveloperMenuVisible(true);
  }, []);

  const referralLink = session?.user.id
    ? `${REFERRAL_BASE}?ref=${encodeURIComponent(session.user.id)}`
    : REFERRAL_BASE;

  const copyReferralLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadData = useCallback(async () => {
    if (!session?.user.id) return;

    setLoading(true);
    try {
      const [profileData, postData, statsData] = await Promise.all([
        fetchMyProfile(session.user.id),
        fetchMyPosts(session.user.id),
        fetchWellnessStats(session.user.id)
      ]);
      setProfile(profileData);
      setPosts(postData);
      setStats(statsData);
    } catch {
      setProfile(null);
      setPosts([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const displayName = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1).replace(/_/g, " ")
    : "User";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onSettingsPress} onLongPress={onSettingsLongPress} hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.handle}>@{profile?.username ?? "user"}</Text>
        <Pressable onPress={() => {}} hitSlop={12}>
          <Ionicons name="menu" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.displayName}>{displayName}</Text>
      <Text style={styles.subtitle}>Movement Enthusiast</Text>
      <Text style={styles.tagline}>Optimizing human performance through posture.</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={copyReferralLink}>
          <Text style={styles.actionButtonText}>{copied ? "Copied!" : "Share Profile"}</Text>
        </Pressable>
      </View>

      {isPremium && (
        <View style={styles.plantarSection}>
          <PlantarPressureChart simulateInsole={__DEV__ && simulateInsole} />
        </View>
      )}

      <View style={styles.sensorSection}>
        <Text style={styles.sensorTitle}>Sensor Status</Text>
        <Text style={styles.sensorStatus}>
          {__DEV__ && simulateInsole
            ? "Simulating insole data (dev mode)"
            : isPremium
              ? "Plantar pressure data from your scans."
              : "Upgrade to Premium to unlock Plantar Pressure insights."}
        </Text>
        <Pressable
          style={styles.preorderButton}
          onPress={() => Linking.openURL(WAITLIST_URL)}
        >
          <Text style={styles.preorderButtonText}>Pre-order / Learn More</Text>
        </Pressable>
      </View>

      {(stats?.postureStreak ?? 0) > 0 && (
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={28} color={Colors.primary} />
          <Text style={styles.streakText}>{stats?.postureStreak ?? 0} Day Posture Streak</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalMovementMinutes ?? 0}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.ringWrap}>
            <ProgressRing
              value={stats?.averagePosturePercent ?? 0}
              max={100}
              size={72}
              strokeWidth={8}
              color={Colors.accent}
            />
            <View style={[styles.ringCenter, { width: 72, height: 72 }]}>
              <Text style={styles.ringValue}>{stats?.averagePosturePercent ?? 0}%</Text>
            </View>
          </View>
          <Text style={styles.statLabel}>Posture</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.winsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
      </View>

      {session?.user.id && (
        <View style={styles.referralCardWrap}>
          <ReferralShareCard userId={session.user.id} />
        </View>
      )}

      <View style={styles.waitlistCard}>
        <View style={styles.waitlistHeader}>
          <Text style={styles.waitlistBadge}>PREMIUM</Text>
          <Text style={styles.waitlistTitle}>Arisole Smart Insole</Text>
          <Text style={styles.waitlistSub}>Skip the line. Refer 3 friends.</Text>
        </View>
        <View style={styles.waitlistRankRow}>
          <Text style={styles.waitlistRankLabel}>Your waitlist rank</Text>
          <Text style={styles.waitlistRankValue}>
            #{String((profile?.points ?? 0) % 9000 + 1000)}
          </Text>
        </View>
        <View style={styles.waitlistProgressWrap}>
          <View style={styles.waitlistProgressBar}>
            <View
              style={[
                styles.waitlistProgressFill,
                { width: `${(referralCount / REFERRALS_NEEDED) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.waitlistProgressText}>
            {referralCount}/{REFERRALS_NEEDED} referrals — Skip the Line
          </Text>
        </View>
        <Pressable style={styles.copyButton} onPress={copyReferralLink}>
          <Text style={styles.copyButtonText}>{copied ? "Copied!" : "Copy Referral Link"}</Text>
        </Pressable>
      </View>

      <Text style={styles.postsTitle}>My posts</Text>
      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Text style={styles.gridText}>{item.likes_count} likes</Text>
          </View>
        )}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      />

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <StreakMilestoneModal
        visible={showStreakModal}
        streak={stats?.postureStreak ?? 0}
        onDismiss={dismissStreakModal}
      />

      {__DEV__ && (
        <DeveloperMenuModal
          visible={developerMenuVisible}
          onClose={() => setDeveloperMenuVisible(false)}
          simulateInsole={simulateInsole}
          onSimulateInsoleChange={setSimulateInsole}
          simulateDark={simulateDark}
          onSimulateDarkChange={setSimulateDark}
        />
      )}
    </View>
  );
}

function DeveloperMenuModal({
  visible,
  onClose,
  simulateInsole,
  onSimulateInsoleChange,
  simulateDark,
  onSimulateDarkChange
}: {
  visible: boolean;
  onClose: () => void;
  simulateInsole: boolean;
  onSimulateInsoleChange: (v: boolean) => void;
  simulateDark: boolean;
  onSimulateDarkChange: (v: boolean) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.devMenuOverlay} onPress={onClose}>
        <Pressable style={styles.devMenuCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.devMenuTitle}>Developer Menu</Text>
          <View style={styles.devMenuRow}>
            <Text style={styles.devMenuLabel}>Simulate Insole Data</Text>
            <Switch
              value={simulateInsole}
              onValueChange={onSimulateInsoleChange}
              trackColor={{ false: Colors.surfaceBorder, true: "#8311D4" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.devMenuRow}>
            <Text style={styles.devMenuLabel}>Simulate Dark (Record)</Text>
            <Switch
              value={simulateDark}
              onValueChange={onSimulateDarkChange}
              trackColor={{ false: Colors.surfaceBorder, true: "#8311D4" }}
              thumbColor="#fff"
            />
          </View>
          <Pressable style={styles.devMenuClose} onPress={onClose}>
            <Text style={styles.devMenuCloseText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  handle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  displayName: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.accent,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colors.text,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  sensorSection: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sensorTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  sensorStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  preorderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  preorderButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: "white",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(131, 17, 212, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(131, 17, 212, 0.3)",
  },
  streakText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  plantarSection: {
    marginBottom: 16,
  },
  referralCardWrap: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontFamily: FontFamily.medium,
  },
  ringWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
  },
  waitlistCard: {
    marginBottom: 24,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  waitlistHeader: {
    marginBottom: 16,
  },
  waitlistBadge: {
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.primaryLight,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  waitlistTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  waitlistSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  waitlistRankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  waitlistRankLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  waitlistRankValue: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  waitlistProgressWrap: {
    marginBottom: 16,
  },
  waitlistProgressBar: {
    height: 8,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  waitlistProgressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  waitlistProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  copyButton: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  copyButtonText: {
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  postsTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 12,
    color: Colors.text,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  gridText: {
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  empty: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.textMuted,
  },
  signOut: {
    marginTop: 24,
    alignSelf: "center",
  },
  signOutText: {
    color: Colors.error,
    fontFamily: FontFamily.bold,
  },
  devMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  devMenuCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  devMenuTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 20,
  },
  devMenuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  devMenuLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.text,
  },
  devMenuClose: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  devMenuCloseText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: Colors.accent,
  },
});
