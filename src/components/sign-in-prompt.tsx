import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

// Shown on screens that need a signed-in guest; sign-in itself lives on the Account tab
export function SignInPrompt({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please sign in</Text>
      <Text style={styles.text}>{message}</Text>
      <Button label="Go to sign in" onPress={() => router.navigate("/account")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.accent[400],
  },
  text: {
    color: colors.primary[200],
    textAlign: "center",
  },
});
