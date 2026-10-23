import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

// The website's header logo, used as the Cabins tab's header title
export function Logo() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="The Wild Oasis">
      <Image source={require("@/assets/images/logo.png")} style={styles.image} />
      <Text style={styles.name}>The Wild Oasis</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  image: {
    width: 34,
    height: 34,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.primary[100],
  },
});
