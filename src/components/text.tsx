import { Text as RNText, StyleSheet, type TextProps } from "react-native";

import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

// React Native Text with the app's default font and color
export function Text({ style, ...props }: TextProps) {
  return <RNText style={[styles.text, style]} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.primary[100],
  },
});
