import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { fetchMyPosts, fetchMyProfile } from "@/services/profile";
import { Post, UserProfile } from "@/types/database";

const REFERRALS_NEEDED = 3;
const REFERRAL_BASE = "https://arisole.app";

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const referralLink = session?.user.id
    ? `${REFERRAL_BASE}?ref=${encodeURIComponent(session.user.id)}`
    : REFERRAL_BASE;

  const copyReferralLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const run = async () => {
      if (!session?.user.id) {
        return;
      }

      setLoading(true);
      const [profileData, postData] = await Promise.all([
        fetchMyProfile(session.user.id),
        fetchMyPosts(session.user.id)
      ]);
      setProfile(profileData);
      setPosts(postData);
      setLoading(false);
    };

    run();
  }, [session?.user.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.username}>@{profile?.username}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.streak_days ?? 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.points ?? 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.level ?? 1}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      <View style={styles.waitlistCard}>
        <View style={styles.waitlistHeader}>
          <Text style={styles.waitlistBadge}>PREMIUM</Text>
          <Text style={styles.waitlistTitle}>Arisole Smart Insole</Text>
          <Text style={styles.waitlistSub}>Skip the line. Refer 3 friends.</Text>
        </View>
        <View style={styles.waitlistRankRow}>
          <Text style={styles.waitlistRankLabel}>Your waitlist rank</Text>
          <Text style={styles.waitlistRankValue}>#{String((profile?.points ?? 0) % 9000 + 1000)}</Text>
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
        renderItem={({ item }) => <View style={styles.gridItem}><Text style={styles.gridText}>{item.likes_count} likes</Text></View>}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      />

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  username: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 18
  },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#116530"
  },
  statLabel: {
    color: "#4B5563"
  },
  waitlistCard: {
    marginBottom: 20,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    overflow: "hidden"
  },
  waitlistHeader: {
    marginBottom: 16
  },
  waitlistBadge: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#fbbf24",
    fontWeight: "800",
    marginBottom: 6
  },
  waitlistTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f8fafc"
  },
  waitlistSub: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4
  },
  waitlistRankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  waitlistRankLabel: {
    color: "#94a3b8",
    fontSize: 14
  },
  waitlistRankValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e2e8f0"
  },
  waitlistProgressWrap: {
    marginBottom: 16
  },
  waitlistProgressBar: {
    height: 8,
    backgroundColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8
  },
  waitlistProgressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4
  },
  waitlistProgressText: {
    fontSize: 12,
    color: "#94a3b8"
  },
  copyButton: {
    backgroundColor: "rgba(248, 250, 252, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  copyButtonText: {
    color: "#f8fafc",
    fontWeight: "700"
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827"
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center"
  },
  gridText: {
    fontWeight: "700",
    color: "#374151"
  },
  empty: {
    marginTop: 20,
    textAlign: "center",
    color: "#6B7280"
  },
  signOut: {
    marginTop: 12,
    alignSelf: "center"
  },
  signOutText: {
    color: "#DC2626",
    fontWeight: "700"
  }
});
