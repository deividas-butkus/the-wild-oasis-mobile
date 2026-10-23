import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/icon";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { haptics } from "@/lib/haptics";

// The ☰ menu at the right of the Cabins header: screens that aren't tabs.
// New screens get a line here.
type MenuItem = { label: string; icon: IconName } & ({ href: Href } | { url: string });

const items: MenuItem[] = [
  { label: "About us", icon: "about", href: "/about" },
  { label: "Our website", icon: "website", url: "https://the-wild-oasis-website-udemy.vercel.app" },
];

export function HeaderMenu() {
  const button = useRef<ComponentRef<typeof Pressable>>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  function open() {
    haptics.selection();
    // Drop the menu down from just below the button
    button.current?.measureInWindow((_x, y, _width, height) => {
      setAnchor({ top: y + height + 4, right: 8 });
    });
  }

  function select(item: MenuItem) {
    setAnchor(null);
    if ("href" in item) router.push(item.href);
    else WebBrowser.openBrowserAsync(item.url);
  }

  return (
    <>
      <Pressable
        ref={button}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Icon name="menu" color={colors.accent[400]} size={26} />
      </Pressable>

      <Modal
        visible={!!anchor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAnchor(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setAnchor(null)}
          accessibilityLabel="Close menu"
        >
          <View style={[styles.panel, anchor]} accessibilityRole="menu">
            {items.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => select(item)}
                accessibilityRole="menuitem"
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Icon name={item.icon} color={colors.accent[400]} />
                <Text style={styles.label}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  panel: {
    position: "absolute",
    minWidth: 200,
    paddingVertical: 6,
    backgroundColor: colors.primary[900],
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemPressed: {
    backgroundColor: colors.primary[800],
  },
  label: {
    fontFamily: fonts.semiBold,
    color: colors.primary[100],
  },
});
