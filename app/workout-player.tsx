import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { MOCK_WORKOUT } from "@/data/mockData";

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const [workout] = useState(MOCK_WORKOUT);
  const [currentIndex, setCurrentIndex] = useState(workout.currentExerciseIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  const current = workout.exercises[currentIndex];
  const progress = (currentIndex + (isPlaying ? 0.5 : 0)) / workout.exercises.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{workout.title}</Text>
        <Text style={styles.duration}>{workout.durationMinutes} min</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentIndex + 1} of {workout.exercises.length} exercises
      </Text>

      <View style={styles.currentCard}>
        <Ionicons name="fitness" size={48} color={Colors.primary} />
        <Text style={styles.currentName}>{current?.name}</Text>
        <Text style={styles.currentDuration}>{current?.duration} sec</Text>
        <Pressable
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.listTitle}>Exercises</Text>
        {workout.exercises.map((ex, i) => (
          <View
            key={ex.id}
            style={[
              styles.exerciseRow,
              i === currentIndex && styles.exerciseRowActive
            ]}
          >
            <View style={styles.exerciseLeft}>
              <Ionicons
                name={ex.completed ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={ex.completed ? Colors.accent : Colors.textMuted}
              />
              <Text
                style={[
                  styles.exerciseName,
                  ex.completed && styles.exerciseNameCompleted
                ]}
              >
                {ex.name}
              </Text>
            </View>
            <Text style={styles.exerciseDuration}>{ex.duration}s</Text>
            {i === currentIndex && (
              <Pressable onPress={() => setCurrentIndex(i)}>
                <Text style={styles.playSmall}>Play</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingTop: 60
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  duration: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: 20,
    borderRadius: 3,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginHorizontal: 20
  },
  currentCard: {
    backgroundColor: Colors.surfaceCard,
    margin: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  currentName: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 4
  },
  currentDuration: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  list: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40 },
  listTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 14
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  exerciseRowActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.1)"
  },
  exerciseLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: Colors.text
  },
  exerciseNameCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through"
  },
  exerciseDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 12
  },
  playSmall: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.primary
  }
});
