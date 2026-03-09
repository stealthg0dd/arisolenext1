import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PressureMap } from "@/components/PressureMap";
import { Colors, FontFamily } from "@/constants/Colors";
import { MOCK_ANALYSIS } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import type { AIAnalysis } from "@/types/database";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<{
    video_url: string;
    caption: string | null;
    gait_score: number | null;
    analysis_json: AIAnalysis | null;
    author?: { username: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("posts")
      .select("video_url, caption, gait_score, analysis_json, user_profiles(username)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setPost(null);
        } else {
          const p = data as any;
          setPost({
            video_url: p.video_url,
            caption: p.caption,
            gait_score: p.gait_score,
            analysis_json: p.analysis_json,
            author: p.user_profiles
          });
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Analysis not found</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const analysis = post.analysis_json ?? MOCK_ANALYSIS;
  const score = post.gait_score ?? analysis?.postureScore ?? MOCK_ANALYSIS.postureScore;
  const insights = analysis?.keyInsights ?? analysis?.insights ?? MOCK_ANALYSIS.keyInsights ?? [];
  const message = analysis?.message ?? MOCK_ANALYSIS.message;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Posture Scorecard</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>AI Posture Score</Text>
        <Text style={styles.scoreValue}>{score}%</Text>
      </View>

      <View style={styles.section}>
        <PressureMap postureScore={score} width={280} height={160} />
      </View>
      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key insights</Text>
          {insights.map((insight, i) => (
            <View key={i} style={styles.insightRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}
      {message && <Text style={styles.message}>{message}</Text>}

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  scoreCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  scoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: FontFamily.extrabold,
    color: Colors.primary
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 12
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20
  }
});
