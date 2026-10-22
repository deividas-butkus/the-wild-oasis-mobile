import type { ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { haptics } from "@/lib/haptics";

// Small form building blocks shared by the reserve, edit-booking and profile screens

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.primary[500]}
      {...props}
      style={[styles.input, props.multiline && styles.multiline, props.style]}
    />
  );
}

type StepperProps = { value: number; min: number; max: number; onChange: (value: number) => void };

export function Stepper({ value, min, max, onChange }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <StepButton label="−" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <StepButton label="+" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === "+" ? "Increase" : "Decrease"}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
    >
      <Text style={[styles.stepLabel, disabled && styles.disabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.semiBold,
    color: colors.primary[200],
  },
  hint: {
    fontSize: 14,
    color: colors.primary[400],
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.primary[100],
    backgroundColor: colors.primary[900],
    borderWidth: 1,
    borderColor: colors.primary[800],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  stepButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: colors.primary[900],
  },
  stepLabel: {
    fontSize: 22,
    color: colors.accent[400],
  },
  disabled: {
    color: colors.primary[700],
  },
  stepValue: {
    minWidth: 40,
    textAlign: "center",
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
});
