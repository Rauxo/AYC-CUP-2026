import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="match/[id]" options={{ title: "Match Details" }} />
      <Stack.Screen name="admin" options={{ title: "Admin Login" }} />
      <Stack.Screen name="admin-dashboard" options={{ title: "Dashboard" }} />
    </Stack>
  );
}
