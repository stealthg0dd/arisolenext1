/**
 * Arisole design system - extracted from Stitch design theme
 * Project: Daily Check-in (Arisole)
 * designTheme: { colorMode: DARK, font: PLUS_JAKARTA_SANS, roundness: ROUND_FULL, customColor: #8311d4 }
 */

export const Colors = {
  // Purples (from Stitch customColor #8311d4)
  primary: "#8311d4",
  primaryLight: "#a855f7",
  primaryLighter: "#c084fc",
  primaryMuted: "#e9d5ff",

  // Greens (accent - from Wellness Profile / Arisole Feed)
  accent: "#00ff9d",
  accentMuted: "#10b981",
  accentDark: "#059669",

  // Dark backgrounds
  background: "#0a0e14",
  backgroundElevated: "#0f0f12",
  surface: "#121212",
  surfaceCard: "#1a1a1a",
  surfaceBorder: "#2d2d2d",

  // Text
  text: "#e5e7eb",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",

  // Borders & dividers
  border: "#374151",
  borderLight: "#4b5563",

  // Semantic
  like: "#E11D48",
  error: "#ef4444",
  success: "#10b981",
} as const;

/**
 * Font family - Plus Jakarta Sans (from Stitch design)
 */
export const FontFamily = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

/**
 * Font weights - Plus Jakarta Sans
 */
export const FontWeights = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};
