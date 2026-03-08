import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

export type OnboardingAnswers = {
  primaryGoal: "posture" | "pain" | "social";
  heelsFrequency: "daily" | "weekly" | "rarely";
  hasDiscomfort: boolean;
};

const defaultAnswers: OnboardingAnswers = {
  primaryGoal: "posture",
  heelsFrequency: "rarely",
  hasDiscomfort: false
};

type OnboardingContextShape = {
  answers: OnboardingAnswers;
  setAnswers: (a: Partial<OnboardingAnswers>) => void;
};

const OnboardingContext = createContext<OnboardingContextShape>({
  answers: defaultAnswers,
  setAnswers: () => {}
});

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [answers, setAnswersState] = useState<OnboardingAnswers>(defaultAnswers);
  const setAnswers = (partial: Partial<OnboardingAnswers>) => {
    setAnswersState((prev) => ({ ...prev, ...partial }));
  };
  const value = useMemo(() => ({ answers, setAnswers }), [answers]);
  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
