import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

export default function CalibrationStep2Screen() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const onSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(false);
    router.push("/calibration/step3");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 2: Pressure Sync</Text>
      <Text style={styles.subtitle}>
        Walk in place for a few seconds to sync pressure sensors.
      </Text>
      <View style={styles.illustration}>
        <Ionicons name="pulse" size={80} color={Colors.primary} />
      </View>
      <Pressable
        style={[styles.button, syncing && styles.buttonDisabled]}
        onPress={onSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.buttonText}>Sync Now</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40
  },
  illustration: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
