import { StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

// Placeholder until Google sign-in (Phase 3 in docs/PLAN.md)
export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your account</Text>
      <Text style={styles.text}>
        Signing in to manage your profile and reservations is coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.accent[400],
  },
  text: {
    color: colors.primary[200],
    textAlign: "center",
  },
});
