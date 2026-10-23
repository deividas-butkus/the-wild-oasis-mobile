import { Link, Tabs } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[950] },
        headerTintColor: colors.accent[400],
        headerTitleStyle: { fontFamily: fonts.semiBold },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.primary[950] },
        tabBarStyle: {
          backgroundColor: colors.primary[950],
          borderTopColor: colors.primary[800],
        },
        tabBarActiveTintColor: colors.accent[400],
        tabBarInactiveTintColor: colors.primary[400],
        tabBarLabelStyle: { fontFamily: fonts.regular },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cabins",
          headerTitle: () => <Logo />,
          tabBarIcon: ({ color, size }) => <Icon name="cabins" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Reservations",
          headerTitle: "Your reservations",
          tabBarIcon: ({ color, size }) => <Icon name="reservations" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerRight: () => <AboutButton />,
          tabBarIcon: ({ color, size }) => <Icon name="account" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

function AboutButton() {
  return (
    <Link href="/about" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="About The Wild Oasis"
        hitSlop={8}
        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
      >
        <Icon name="about" color={colors.accent[400]} size={24} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
});
