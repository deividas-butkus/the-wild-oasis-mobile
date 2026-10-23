import { router, type Href } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import { Animated, Modal, Platform, Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/icon";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { haptics } from "@/lib/haptics";

// The ☰ menu at the right of the Cabins header: screens that aren't tabs.
// New screens get a line here.
type MenuItem = { label: string; icon: IconName; href: Href };

const items: MenuItem[] = [{ label: "About us", icon: "about", href: "/about" }];

type Rect = { x: number; y: number; width: number; height: number };

export function HeaderMenu() {
  const button = useRef<ComponentRef<typeof Pressable>>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Where the header button is, to drop the menu below it and draw the ✕ over it.
  // Kept after closing so the menu fades out in place.
  const [anchor, setAnchor] = useState<Rect | null>(null);
  const chosen = useRef<MenuItem | null>(null);
  // 0 = ☰, 1 = ✕; shared by the header button and its copy above the backdrop
  const [progress] = useState(() => new Animated.Value(0));

  function animateTo(value: number) {
    Animated.timing(progress, {
      toValue: value,
      duration: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  function open() {
    haptics.selection();
    button.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setIsOpen(true);
      animateTo(1);
    });
  }

  function close() {
    setIsOpen(false);
    animateTo(0);
  }

  // On iOS, presenting anything while the menu is still closing can fail silently, so there
  // the choice waits for the menu's onDismiss (iOS only)
  function select(item: MenuItem) {
    close();
    if (Platform.OS === "ios") chosen.current = item;
    else router.push(item.href);
  }

  function handleDismiss() {
    const item = chosen.current;
    chosen.current = null;
    if (item) router.push(item.href);
  }

  return (
    <>
      <Pressable
        ref={button}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        accessibilityState={{ expanded: isOpen }}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <MenuIcon progress={progress} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
        onDismiss={handleDismiss}
      >
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu">
          {anchor && (
            <>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                hitSlop={8}
                style={[
                  styles.closeButton,
                  { left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height },
                ]}
              >
                <MenuIcon progress={progress} />
              </Pressable>
              <View
                style={[styles.panel, { top: anchor.y + anchor.height + 4, right: 8 }]}
                accessibilityRole="menu"
              >
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
            </>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

// Three bars; the outer two turn into a ✕ and the middle one fades as progress goes 0 → 1
function MenuIcon({ progress }: { progress: Animated.Value }) {
  const offset = barGap + barHeight;
  const outer = (direction: 1 | -1) => ({
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, direction * offset],
        }),
      },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${direction * 45}deg`],
        }),
      },
    ],
  });

  return (
    <View style={styles.icon}>
      <Animated.View style={[styles.bar, outer(1)]} />
      <Animated.View
        style={[
          styles.bar,
          { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      />
      <Animated.View style={[styles.bar, outer(-1)]} />
    </View>
  );
}

const barHeight = 2;
const barGap = 5;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  closeButton: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 22,
    gap: barGap,
  },
  bar: {
    height: barHeight,
    borderRadius: barHeight / 2,
    backgroundColor: colors.accent[400],
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
