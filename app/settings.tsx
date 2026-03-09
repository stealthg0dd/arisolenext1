import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{session?.user?.email ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <Pressable style={styles.row} onPress={() => router.push("/subscription")}>
          <Text style={styles.rowLabel}>Subscription</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/stats-history")}>
          <Text style={styles.rowLabel}>Stats History</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.text
  },
  rowValue: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  signOut: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center"
  },
  signOutText: {
    color: Colors.error,
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
