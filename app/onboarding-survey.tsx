import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useOnboarding } from "@/providers/OnboardingProvider";

const STEPS = 3;

export default function OnboardingSurveyScreen() {
  const router = useRouter();
  const { answers, setAnswers } = useOnboarding();
  const [step, setStep] = useState(0);

  const progress = (step + 1) / STEPS;

  const onNext = () => {
    if (step < STEPS - 1) {
      setStep(step + 1);
    } else {
      router.replace("/(tabs)/record");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step + 1} of {STEPS}</Text>
      </View>

      {step === 0 && (
        <View style={styles.step}>
          <Text style={styles.question}>What is your primary goal?</Text>
          {(["posture", "pain", "social"] as const).map((key) => (
            <Pressable
              key={key}
              style={[styles.option, answers.primaryGoal === key && styles.optionSelected]}
              onPress={() => setAnswers({ primaryGoal: key })}
            >
              <Text style={[styles.optionText, answers.primaryGoal === key && styles.optionTextSelected]}>
                {key === "posture" && "Better Posture"}
                {key === "pain" && "Pain Relief"}
                {key === "social" && "Social / Fun"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.question}>How often do you wear heels or restrictive shoes?</Text>
          {(["daily", "weekly", "rarely"] as const).map((key) => (
            <Pressable
              key={key}
              style={[styles.option, answers.heelsFrequency === key && styles.optionSelected]}
              onPress={() => setAnswers({ heelsFrequency: key })}
            >
              <Text style={[styles.optionText, answers.heelsFrequency === key && styles.optionTextSelected]}>
                {key === "daily" && "Daily"}
                {key === "weekly" && "Weekly"}
                {key === "rarely" && "Rarely"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <Text style={styles.question}>Do you have existing foot or back discomfort?</Text>
          <Pressable
            style={[styles.option, answers.hasDiscomfort === true && styles.optionSelected]}
            onPress={() => setAnswers({ hasDiscomfort: true })}
          >
            <Text style={[styles.optionText, answers.hasDiscomfort === true && styles.optionTextSelected]}>Yes</Text>
          </Pressable>
          <Pressable
            style={[styles.option, answers.hasDiscomfort === false && styles.optionSelected]}
            onPress={() => setAnswers({ hasDiscomfort: false })}
          >
            <Text style={[styles.optionText, answers.hasDiscomfort === false && styles.optionTextSelected]}>No</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>{step < STEPS - 1 ? "Next" : "Start scanning"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 60
  },
  progressWrap: {
    marginBottom: 40
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00ff9d",
    borderRadius: 3
  },
  progressText: {
    fontSize: 13,
    color: "#94a3b8"
  },
  step: {
    flex: 1
  },
  question: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 24
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(148, 163, 184, 0.3)",
    marginBottom: 12
  },
  optionSelected: {
    borderColor: "#00ff9d",
    backgroundColor: "rgba(0, 255, 157, 0.1)"
  },
  optionText: {
    fontSize: 16,
    color: "#e2e8f0"
  },
  optionTextSelected: {
    color: "#00ff9d",
    fontWeight: "700"
  },
  nextButton: {
    backgroundColor: "#00ff9d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0e14"
  }
});
