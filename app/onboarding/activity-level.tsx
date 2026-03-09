import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useOnboardingStore, type OnboardingActivityLevel } from "@/stores/onboardingStore";

const LEVELS: { id: OnboardingActivityLevel; label: string; desc: string; icon: "desktop-outline" | "walk-outline" | "fitness-outline" | "flash-outline" }[] = [
  { id: "sedentary", label: "Sedentary", desc: "Mostly sitting", icon: "desktop-outline" },
  { id: "light", label: "Light", desc: "Walking, light activity", icon: "walk-outline" },
  { id: "moderate", label: "Moderate", desc: "Regular exercise", icon: "fitness-outline" },
  { id: "active", label: "Active", desc: "Daily workouts", icon: "flash-outline" }
];

export default function OnboardingActivityLevelScreen() {
  const router = useRouter();
  const { activityLevel, setActivityLevel } = useOnboardingStore();

  const onNext = () => {
    router.push("/onboarding/smart-insoles");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What&apos;s your activity level?</Text>
      <Text style={styles.subtitle}>Helps us tailor your movement insights.</Text>

      <View style={styles.options}>
        {LEVELS.map((l) => (
          <Pressable
            key={l.id}
            style={[styles.option, activityLevel === l.id && styles.optionSelected]}
            onPress={() => setActivityLevel(l.id)}
          >
            <Ionicons
              name={l.icon}
              size={26}
              color={activityLevel === l.id ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, activityLevel === l.id && styles.optionLabelSelected]}>
                {l.label}
              </Text>
              <Text style={styles.optionDesc}>{l.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, !activityLevel && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!activityLevel}
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
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    color: Colors.text
  },
  optionLabelSelected: { color: Colors.primaryLight },
  optionDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
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
