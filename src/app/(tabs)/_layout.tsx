import { Tabs } from "expo-router";

import { HeaderMenu } from "@/components/header-menu";
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
          headerRight: () => <HeaderMenu />,
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
          tabBarIcon: ({ color, size }) => <Icon name="account" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
