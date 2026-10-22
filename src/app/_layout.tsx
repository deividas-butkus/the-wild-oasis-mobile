import {
  JosefinSans_300Light,
  JosefinSans_400Regular,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
  useFonts,
} from "@expo-google-fonts/josefin-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { AuthProvider } from "@/lib/auth";
import { isNotFound } from "@/lib/errors";

// A deep link straight to a cabin still gets the tabs underneath, so "back" works
export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the splash screen up until the fonts are ready
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // Retry network hiccups, but a missing record won't appear on retry
      retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_600SemiBold,
    JosefinSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary[950] },
            headerTintColor: colors.accent[400],
            headerTitleStyle: { fontFamily: fonts.semiBold },
            contentStyle: { backgroundColor: colors.primary[950] },
          }}
        >
          {/* title is what the back button shows on screens pushed over the tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Cabins" }} />
          <Stack.Screen name="cabins/[id]/index" options={{ title: "Cabin" }} />
          <Stack.Screen name="cabins/[id]/reserve" options={{ title: "Reserve" }} />
          <Stack.Screen name="reservations/[id]" options={{ title: "Edit reservation" }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
