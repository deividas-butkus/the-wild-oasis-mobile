import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

// Full-screen loading and error states shared by the data screens

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.accent[500]} />
    </View>
  );
}

type ErrorStateProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={() => onRetry()}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  message: {
    color: colors.primary[200],
    textAlign: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.accent[500],
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    color: colors.primary[800],
  },
});
