import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { fetchMyPosts, fetchMyProfile } from "@/services/profile";
import { Post, UserProfile } from "@/types/database";

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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
