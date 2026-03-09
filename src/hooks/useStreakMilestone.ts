import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { STREAK_MILESTONES } from "@/services/stats";

const STORAGE_KEY = "arisole_last_shown_streak_milestone";

export function useStreakMilestone(streak: number) {
  const [showModal, setShowModal] = useState(false);

  const dismiss = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    if (streak < 3) return;

    const check = async () => {
      try {
        const last = await AsyncStorage.getItem(STORAGE_KEY);
        const lastShown = last ? parseInt(last, 10) : 0;
        const milestone = STREAK_MILESTONES.find((m) => m === streak);
        if (milestone && milestone > lastShown) {
          await AsyncStorage.setItem(STORAGE_KEY, String(milestone));
          setShowModal(true);
        }
      } catch {
        // ignore
      }
    };

    check();
  }, [streak]);

  return { showModal, dismiss };
}
