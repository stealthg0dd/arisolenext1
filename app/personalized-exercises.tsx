import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { MOCK_EXERCISES } from "@/data/mockData";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  walk: "walk",
  body: "body",
  fitness: "fitness",
  "ellipse-outline": "ellipse-outline"
};

export default function PersonalizedExercisesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Personalized Exercises</Text>
      </View>

      <Text style={styles.subtitle}>
        Based on your gait analysis. Focus on balance and symmetry.
      </Text>

      {MOCK_EXERCISES.map((ex) => (
        <Pressable
          key={ex.id}
          style={styles.card}
          onPress={() => router.push("/workout-player")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={ICON_MAP[ex.icon] ?? "fitness"}
                size={28}
                color={Colors.primary}
              />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{ex.name}</Text>
              <Text style={styles.cardMeta}>
                {ex.sets} sets × {ex.duration}s
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </View>
          <Text style={styles.cardDesc}>{ex.description}</Text>
        </Pressable>
      ))}

      <Pressable
        style={styles.startButton}
        onPress={() => router.push("/workout-player")}
      >
        <Text style={styles.startButtonText}>Start Workout</Text>
        <Ionicons name="play" size={20} color="white" />
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
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(131, 17, 212, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8
  },
  startButtonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
