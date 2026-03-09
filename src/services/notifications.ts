import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

/**
 * Requests permissions and returns the Expo push token if granted.
 * Returns null on simulator, web, or when permissions are denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (status !== "granted") {
      return null;
    }
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId
  });

  return token?.startsWith("ExponentPushToken") ? token : null;
}

/**
 * Registers the push token with Supabase and saves it to user_profiles.
 * Call after login when the user has granted notification permissions.
 */
export async function registerPushToken(userId: string): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;

  const { error } = await supabase
    .from("user_profiles")
    .update({ expo_push_token: token })
    .eq("id", userId);

  if (error) {
    console.warn("Failed to save push token:", error.message);
  }
}
