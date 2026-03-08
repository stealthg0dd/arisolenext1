import React from "react";
import { View } from "react-native";
import Svg, { Defs, Path, G } from "react-native-svg";

/**
 * Maps postureScore (0-100) to a color on a Red -> Green gradient.
 * Low score = red, high score = green.
 */
export function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const t = clamped / 100;
  const r = Math.round(255 * (1 - t));
  const g = Math.round(255 * t);
  const b = Math.round(80 * (1 - t));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns colors for Heel, Arch, and Toes based on postureScore.
 * Gradient applied across zones: Heel (slightly lower), Arch (score), Toes (slightly higher).
 */
export function getPressureColors(postureScore: number): { heel: string; arch: string; toes: string } {
  const s = Math.max(0, Math.min(100, postureScore));
  return {
    heel: scoreToColor(s * 0.85),
    arch: scoreToColor(s),
    toes: scoreToColor(Math.min(100, s * 1.15))
  };
}

const W = 90;
const H = 130;

/** One foot: heel (ellipse at back), arch (middle band), toes (front ellipse). */
function OneFoot({
  x,
  heelColor,
  archColor,
  toesColor
}: {
  x: number;
  heelColor: string;
  archColor: string;
  toesColor: string;
}) {
  const heel = `M ${x + 20} 25 A 22 28 0 0 1 ${x + 70} 25 A 22 28 0 0 1 ${x + 20} 25`;
  const arch = `M ${x + 18} 50 L ${x + 72} 50 L ${x + 72} 88 L ${x + 18} 88 Z`;
  const toes = `M ${x + 25} 85 A 20 22 0 0 1 ${x + 65} 85 A 20 22 0 0 1 ${x + 25} 85 L ${x + 25} 118 L ${x + 65} 118 L ${x + 65} 85`;
  return (
    <G>
      <Path d={heel} fill={heelColor} stroke="#374151" strokeWidth={1.5} />
      <Path d={arch} fill={archColor} stroke="#374151" strokeWidth={1.5} />
      <Path d={toes} fill={toesColor} stroke="#374151" strokeWidth={1.5} />
    </G>
  );
}

type PressureMapProps = {
  postureScore: number;
  width?: number;
  height?: number;
};

export function PressureMap({ postureScore, width = 200, height = 140 }: PressureMapProps) {
  const { heel, arch, toes } = getPressureColors(postureScore);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W * 2 + 24} ${H}`}>
        <G transform="translate(12, 6)">
          <OneFoot x={0} heelColor={heel} archColor={arch} toesColor={toes} />
          <OneFoot x={W + 12} heelColor={heel} archColor={arch} toesColor={toes} />
        </G>
      </Svg>
    </View>
  );
}
