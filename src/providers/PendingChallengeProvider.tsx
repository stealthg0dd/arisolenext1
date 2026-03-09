import { createContext, useCallback, useContext, useState } from "react";

type PendingChallengeContextValue = {
  pendingChallengeId: string | null;
  pendingChallengeName: string | null;
  setPendingChallenge: (challengeId: string | null, name: string | null) => void;
  clearPendingChallenge: () => void;
};

const PendingChallengeContext = createContext<PendingChallengeContextValue | null>(null);

export function usePendingChallenge() {
  const ctx = useContext(PendingChallengeContext);
  return ctx ?? {
    pendingChallengeId: null,
    pendingChallengeName: null,
    setPendingChallenge: () => {},
    clearPendingChallenge: () => {},
  };
}

export function PendingChallengeProvider({ children }: { children: React.ReactNode }) {
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [pendingChallengeName, setPendingChallengeName] = useState<string | null>(null);

  const setPendingChallenge = useCallback((id: string | null, name: string | null) => {
    setPendingChallengeId(id);
    setPendingChallengeName(name);
  }, []);

  const clearPendingChallenge = useCallback(() => {
    setPendingChallengeId(null);
    setPendingChallengeName(null);
  }, []);

  return (
    <PendingChallengeContext.Provider
      value={{
        pendingChallengeId,
        pendingChallengeName,
        setPendingChallenge,
        clearPendingChallenge,
      }}
    >
      {children}
    </PendingChallengeContext.Provider>
  );
}
