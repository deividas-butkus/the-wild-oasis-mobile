import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  busy?: boolean;
};

export function Button({ label, onPress, variant = "primary", busy = false }: Props) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        (pressed || busy) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? colors.primary[800] : colors.primary[200]} />
      ) : (
        <Text style={[styles.label, primary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent[500],
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  dimmed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.semiBold,
  },
  primaryLabel: {
    color: colors.primary[800],
  },
  secondaryLabel: {
    color: colors.primary[200],
  },
});
