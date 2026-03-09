import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { PressureMap } from "@/components/PressureMap";
import { Colors, FontFamily } from "@/constants/Colors";
import { MOCK_ANALYSIS } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import type { AIAnalysis } from "@/types/database";

export default function FullGaitAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [score, setScore] = useState<number>(82);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) {
      setAnalysis(MOCK_ANALYSIS);
      setScore(MOCK_ANALYSIS.postureScore);
      setLoading(false);
      return;
    }
    supabase
      .from("posts")
      .select("gait_score, analysis_json")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setAnalysis(MOCK_ANALYSIS);
          setScore(MOCK_ANALYSIS.postureScore);
        } else {
          const a = data as { gait_score?: number; analysis_json?: AIAnalysis };
          setAnalysis(a.analysis_json ?? MOCK_ANALYSIS);
          setScore(a.gait_score ?? a.analysis_json?.postureScore ?? MOCK_ANALYSIS.postureScore);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const a = analysis ?? MOCK_ANALYSIS;
  const insights = a.keyInsights ?? a.insights ?? MOCK_ANALYSIS.keyInsights ?? [];
  const gaitPhases = a.gaitPhases ?? MOCK_ANALYSIS.gaitPhases ?? [];
  const symmetry = a.symmetryScore ?? 78;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Full Gait Analysis</Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Posture</Text>
          <Text style={styles.scoreValue}>{score}%</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Symmetry</Text>
          <Text style={styles.scoreValue}>{symmetry}%</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pressure Map</Text>
        <View style={styles.pressureWrap}>
          <PressureMap postureScore={score} width={280} height={160} />
        </View>
      </View>

      {gaitPhases.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gait Phases</Text>
          <View style={styles.phasesRow}>
            {gaitPhases.map((p, i) => (
              <View key={i} style={styles.phaseChip}>
                <Text style={styles.phaseTime}>{p.timestamp.toFixed(2)}s</Text>
                <Text style={styles.phaseName}>{p.phase}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          {insights.map((insight, i) => (
            <View key={i} style={styles.insightRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {a.message && (
        <View style={styles.messageCard}>
          <Text style={styles.message}>{a.message}</Text>
        </View>
      )}

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
  scoreRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24
  },
  scoreCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6
  },
  scoreValue: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 12
  },
  pressureWrap: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  phasesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phaseChip: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  phaseTime: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  phaseName: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.text
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text
  },
  messageCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22
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
  }
});
