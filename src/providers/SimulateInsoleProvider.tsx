import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY_INSOLE = "arisole_simulate_insole";
const STORAGE_KEY_DARK = "arisole_simulate_dark";

type ContextValue = {
  simulateInsole: boolean;
  setSimulateInsole: (value: boolean) => void;
  simulateDark: boolean;
  setSimulateDark: (value: boolean) => void;
};

const Context = createContext<ContextValue | null>(null);

export function SimulateInsoleProvider({ children }: { children: React.ReactNode }) {
  const [simulateInsole, setInsoleState] = useState(false);
  const [simulateDark, setDarkState] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_INSOLE),
      AsyncStorage.getItem(STORAGE_KEY_DARK)
    ]).then(([v1, v2]) => {
      setInsoleState(v1 === "true");
      setDarkState(v2 === "true");
    });
  }, []);

  const setSimulateInsole = useCallback((value: boolean) => {
    setInsoleState(value);
    AsyncStorage.setItem(STORAGE_KEY_INSOLE, String(value));
  }, []);

  const setSimulateDark = useCallback((value: boolean) => {
    setDarkState(value);
    AsyncStorage.setItem(STORAGE_KEY_DARK, String(value));
  }, []);

  return (
    <Context.Provider
      value={{ simulateInsole, setSimulateInsole, simulateDark, setSimulateDark }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSimulateInsole() {
  const ctx = useContext(Context);
  if (!ctx) {
    return {
      simulateInsole: false,
      setSimulateInsole: () => {},
      simulateDark: false,
      setSimulateDark: () => {}
    };
  }
  return ctx;
}
