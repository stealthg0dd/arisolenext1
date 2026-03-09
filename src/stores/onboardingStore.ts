import { create } from "zustand";

export type OnboardingGoal = "posture" | "gait" | "recovery" | "performance";
export type OnboardingActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type OnboardingSmartInsoles = "yes" | "interested" | "no";

type OnboardingState = {
  goal: OnboardingGoal | null;
  activityLevel: OnboardingActivityLevel | null;
  smartInsoles: OnboardingSmartInsoles | null;
  setGoal: (goal: OnboardingGoal) => void;
  setActivityLevel: (level: OnboardingActivityLevel) => void;
  setSmartInsoles: (value: OnboardingSmartInsoles) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  goal: null,
  activityLevel: null,
  smartInsoles: null,
  setGoal: (goal) => set({ goal }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
  setSmartInsoles: (smartInsoles) => set({ smartInsoles }),
  reset: () => set({ goal: null, activityLevel: null, smartInsoles: null })
}));
