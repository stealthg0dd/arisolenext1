/**
 * Stitch-styled error toast - purple theme #8311d4
 */
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
};

export function Toast({ message, visible, onDismiss, duration = 4000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !message) return;

    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.delay(duration - 400),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => onDismiss());
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.card}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center"
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    maxWidth: "100%"
  },
  text: {
    color: Colors.text,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    textAlign: "center"
  }
});
