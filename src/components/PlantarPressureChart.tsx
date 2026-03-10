import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { Colors, FontFamily } from "@/constants/Colors";

/** Stitch-defined SVG zone IDs for reactive heat map */
const ZONE_IDS = {
  HEEL_L: "zone-heel-l",
  HEEL_R: "zone-heel-r",
  MID_L: "zone-mid-l",
  MID_R: "zone-mid-r",
  FORE_L: "zone-fore-l",
  FORE_R: "zone-fore-r"
} as const;

const HEAT_COLORS = [Colors.primary, Colors.primaryLight, Colors.primaryLighter, Colors.primaryMuted, Colors.primaryLight];

type ZoneKey = keyof typeof ZONE_IDS;

type Props = {
  /** When true, cycles Heel and Forefoot zone colors for live demo */
  simulateInsole?: boolean;
};

/**
 * Plantar Pressure chart with Stitch SVG IDs.
 * When simulateInsole is enabled, cycles Heel and Forefoot zone fill colors.
 */
export function PlantarPressureChart({ simulateInsole = true }: Props) {
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (!simulateInsole) return;
    const id = setInterval(() => {
      setCycleIndex((i) => (i + 1) % HEAT_COLORS.length);
    }, 800);
    return () => clearInterval(id);
  }, [simulateInsole]);

  const width = 200;
  const height = 120;
  const padding = 8;

  const zones: { id: ZoneKey; label: string; value: number; x: number; y: number; w: number; h: number; isCycling: boolean }[] = [
    { id: "HEEL_L", label: "Heel L", value: 0.85, x: 0, y: 0, w: 45, h: 40, isCycling: true },
    { id: "HEEL_R", label: "Heel R", value: 0.78, x: 55, y: 0, w: 45, h: 40, isCycling: true },
    { id: "MID_L", label: "Mid L", value: 0.62, x: 0, y: 42, w: 45, h: 36, isCycling: false },
    { id: "MID_R", label: "Mid R", value: 0.68, x: 55, y: 42, w: 45, h: 36, isCycling: false },
    { id: "FORE_L", label: "Fore L", value: 0.92, x: 0, y: 80, w: 45, h: 40, isCycling: true },
    { id: "FORE_R", label: "Fore R", value: 0.88, x: 55, y: 80, w: 45, h: 40, isCycling: true }
  ];

  const getColor = (z: (typeof zones)[0]) => {
    if (simulateInsole && z.isCycling) {
      return HEAT_COLORS[cycleIndex];
    }
    if (z.value >= 0.8) return Colors.primary;
    if (z.value >= 0.5) return Colors.primaryLight;
    return Colors.primaryLighter;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plantar Pressure (Simulated)</Text>
      <Svg width={width} height={height} style={styles.svg}>
        {zones.map((z) => {
          const color = getColor(z);
          return (
            <Rect
              key={z.id}
              id={ZONE_IDS[z.id]}
              x={padding + z.x}
              y={padding + z.y}
              width={z.w - 4}
              height={z.h - 4}
              rx={4}
              fill={color}
              fillOpacity={0.3 + z.value * 0.5}
              stroke={color}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
      <View style={styles.legend}>
        {zones.map((z) => (
          <View key={z.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getColor(z) }]} />
            <Text style={styles.legendText}>
              {z.label}: {Math.round(z.value * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 12,
  },
  svg: {
    alignSelf: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
});
