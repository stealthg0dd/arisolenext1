import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useOnboardingStore, type OnboardingGoal } from "@/stores/onboardingStore";

const GOALS: { id: OnboardingGoal; label: string; icon: "body-outline" | "walk-outline" | "heart-outline" | "trophy-outline" }[] = [
  { id: "posture", label: "Improve posture", icon: "body-outline" },
  { id: "gait", label: "Optimize gait", icon: "walk-outline" },
  { id: "recovery", label: "Recovery & wellness", icon: "heart-outline" },
  { id: "performance", label: "Peak performance", icon: "trophy-outline" }
];

export default function OnboardingGoalScreen() {
  const router = useRouter();
  const { goal, setGoal } = useOnboardingStore();

  const onNext = () => {
    router.push("/onboarding/activity-level");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What&apos;s your main goal?</Text>
      <Text style={styles.subtitle}>We&apos;ll personalize your experience.</Text>

      <View style={styles.options}>
        {GOALS.map((g) => (
          <Pressable
            key={g.id}
            style={[styles.option, goal === g.id && styles.optionSelected]}
            onPress={() => setGoal(g.id)}
          >
            <Ionicons
              name={g.icon}
              size={28}
              color={goal === g.id ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.optionLabel, goal === g.id && styles.optionLabelSelected]}>
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, !goal && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!goal}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 80, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32
  },
  options: { gap: 14, marginBottom: 40 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.12)"
  },
  optionLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    color: Colors.text
  },
  optionLabelSelected: { color: Colors.primaryLight },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
