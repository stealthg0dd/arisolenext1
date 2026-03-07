import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/providers/AuthProvider";
import { submitDailyCheckIn } from "@/services/checkin";

export default function CheckInScreen() {
  const { session } = useAuth();
  const [feeling, setFeeling] = useState("7");
  const [shoeType, setShoeType] = useState("Road");
  const [activity, setActivity] = useState<"walk" | "run">("walk");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!session?.user.id) {
      return;
    }

    const score = Number(feeling);
    if (Number.isNaN(score) || score < 1 || score > 10) {
      Alert.alert("Invalid score", "Feeling score must be 1-10.");
      return;
    }

    setBusy(true);

    try {
      await submitDailyCheckIn({
        userId: session.user.id,
        feelingScore: score,
        shoeType,
        activity
      });
      Alert.alert("Check-in saved", "Your streak has been updated.");
    } catch (error: any) {
      Alert.alert("Check-in failed", error.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Check-in</Text>

      <Text style={styles.label}>Feeling score (1-10)</Text>
      <TextInput value={feeling} onChangeText={setFeeling} keyboardType="number-pad" style={styles.input} />

      <Text style={styles.label}>Shoe type</Text>
      <TextInput value={shoeType} onChangeText={setShoeType} style={styles.input} />

      <Text style={styles.label}>Activity</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.pill, activity === "walk" && styles.pillActive]}
          onPress={() => setActivity("walk")}
        >
          <Text style={[styles.pillText, activity === "walk" && styles.pillTextActive]}>Walk</Text>
        </Pressable>
        <Pressable
          style={[styles.pill, activity === "run" && styles.pillActive]}
          onPress={() => setActivity("run")}
        >
          <Text style={[styles.pillText, activity === "run" && styles.pillTextActive]}>Run</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={onSubmit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Saving..." : "Save Check-in"}</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E3B1E",
    marginBottom: 20
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "white",
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18
  },
  pill: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999
  },
  pillActive: {
    backgroundColor: "#116530",
    borderColor: "#116530"
  },
  pillText: {
    color: "#111827",
    fontWeight: "700"
  },
  pillTextActive: {
    color: "white"
  },
  button: {
    backgroundColor: "#116530",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  buttonText: {
    color: "white",
    fontWeight: "700"
  }
});
