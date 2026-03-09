import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export default function TabsLayout() {
  const { isPremium } = useSubscriptionStatus();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.surfaceBorder,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: "home",
            record: "videocam",
            coach: "sparkles",
            checkin: "checkmark-circle",
            challenges: "trophy",
            profile: "person"
          };

          return <Ionicons name={iconMap[route.name] ?? "ellipse"} size={size} color={color} />;
        }
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Feed" }} />
      <Tabs.Screen name="record" options={{ title: "Record" }} />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          href: isPremium ? undefined : null
        }}
      />
      <Tabs.Screen name="checkin" options={{ title: "Check-in" }} />
      <Tabs.Screen name="challenges" options={{ title: "Challenges" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
