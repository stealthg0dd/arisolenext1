import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { DailyCheckInModal } from "@/components/DailyCheckInModal";
import { DailyInsightCard } from "@/components/DailyInsightCard";
import { useAuth } from "@/providers/AuthProvider";
import { hasLoggedToday } from "@/services/dailyLogs";
import type { EmojiMood } from "@/services/dailyLogs";

type DailyCheckInContextValue = {
  showCheckIn: () => void;
};

const DailyCheckInContext = createContext<DailyCheckInContextValue | null>(null);

export function useDailyCheckIn() {
  const ctx = useContext(DailyCheckInContext);
  return ctx ?? { showCheckIn: () => {} };
}

export function DailyCheckInProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [recentCheckIn, setRecentCheckIn] = useState<{
    emojiMood: EmojiMood;
    energyLevel: number;
  } | null>(null);

  const showCheckIn = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (!session?.user.id || checked) return;

    const check = async () => {
      const logged = await hasLoggedToday(session.user.id);
      setChecked(true);
      if (!logged) {
        setVisible(true);
      }
    };

    check();
  }, [session?.user.id, checked]);

  const onDismiss = useCallback(() => setVisible(false), []);

  const onSave = useCallback((emojiMood: EmojiMood, energyLevel: number) => {
    setRecentCheckIn({ emojiMood, energyLevel });
  }, []);

  const dismissInsight = useCallback(() => setRecentCheckIn(null), []);

  const onRecordPress = useCallback(() => {
    dismissInsight();
    router.push("/(tabs)/record");
  }, [dismissInsight, router]);

  return (
    <DailyCheckInContext.Provider value={{ showCheckIn }}>
      {children}
      <DailyCheckInModal visible={visible} onDismiss={onDismiss} onSave={onSave} />
      {recentCheckIn && (
        <DailyInsightCard
          emojiMood={recentCheckIn.emojiMood}
          energyLevel={recentCheckIn.energyLevel}
          onDismiss={dismissInsight}
          onRecordPress={onRecordPress}
        />
      )}
    </DailyCheckInContext.Provider>
  );
}
