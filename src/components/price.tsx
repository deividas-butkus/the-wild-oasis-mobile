import { StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";

type Props = { regularPrice: number; discount: number };

// Price per night; a discount shows the reduced price with the regular one struck through
export function Price({ regularPrice, discount }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.price}>${regularPrice - discount}</Text>
      {discount > 0 && <Text style={styles.regular}>${regularPrice}</Text>}
      <Text style={styles.unit}>/ night</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontFamily: fonts.light,
    fontSize: 26,
    color: colors.primary[50],
  },
  regular: {
    fontFamily: fonts.semiBold,
    color: colors.primary[600],
    textDecorationLine: "line-through",
  },
  unit: {
    color: colors.primary[200],
  },
});
