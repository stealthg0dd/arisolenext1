import { Session } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type AuthContextShape = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextShape>({
  session: null,
  loading: true
});

function isGuestAllowedRoute(segments: string[]): boolean {
  const first = segments[0];
  if (first === undefined || first === "") return true;
  if (first === "onboarding-survey") return true;
  if (first === "(auth)") return true;
  if (first === "(tabs)" && segments[1] === "record") return true;
  return false;
}

function isProtectedTabsRoute(segments: string[]): boolean {
  return segments[0] === "(tabs)" && segments[1] !== "record";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (session) {
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
      return;
    }

    if (!session) {
      if (inAuthGroup) {
        return;
      }
      if (isProtectedTabsRoute(segments)) {
        router.replace("/");
        return;
      }
      if (!isGuestAllowedRoute(segments)) {
        router.replace("/");
      }
    }
  }, [loading, segments, router, session]);

  const value = useMemo(
    () => ({
      session,
      loading
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
