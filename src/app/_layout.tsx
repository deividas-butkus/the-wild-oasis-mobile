import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/constants/colors";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary[950] },
          headerTintColor: colors.accent[400],
          contentStyle: { backgroundColor: colors.primary[950] },
        }}
      >
        <Stack.Screen name="index" options={{ title: "The Wild Oasis" }} />
      </Stack>
    </>
  );
}
