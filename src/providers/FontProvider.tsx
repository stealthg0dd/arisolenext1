import type { ReactNode } from "react";

let FontLoaderComponent: React.ComponentType<{ children: ReactNode }> | null = null;

try {
  require.resolve("@expo-google-fonts/plus-jakarta-sans");
  require.resolve("expo-splash-screen");
  FontLoaderComponent = require("./FontLoaderInner").FontLoaderInner;
} catch {
  // Font packages not installed - use system fonts
}

export function FontProvider({ children }: { children: ReactNode }) {
  if (FontLoaderComponent) {
    return <FontLoaderComponent>{children}</FontLoaderComponent>;
  }
  return <>{children}</>;
}
