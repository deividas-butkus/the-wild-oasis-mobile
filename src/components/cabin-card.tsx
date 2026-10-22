import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icon";
import { Price } from "@/components/price";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { CabinSummary } from "@/lib/cabins";

export function CabinCard({ cabin }: { cabin: CabinSummary }) {
  const { id, name, maxCapacity, regularPrice, discount, image } = cabin;

  return (
    <Link href={{ pathname: "/cabins/[id]", params: { id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <Image
          source={image}
          style={styles.image}
          recyclingKey={String(id)}
          transition={{ duration: 300, effect: "cross-dissolve" }}
          accessibilityLabel={`Cabin ${name}`}
        />
        <View style={styles.body}>
          <Text style={styles.name}>Cabin {name}</Text>
          <View style={styles.capacity}>
            <Icon name="guests" color={colors.primary[600]} />
            <Text style={styles.capacityText}>
              For up to <Text style={styles.bold}>{maxCapacity}</Text> guests
            </Text>
          </View>
          <View style={styles.footer}>
            <Price regularPrice={regularPrice} discount={discount} />
            <Text style={styles.details}>Details →</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.primary[800],
    backgroundColor: colors.primary[950],
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: colors.primary[900],
  },
  body: {
    padding: 16,
    gap: 10,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.accent[500],
  },
  capacity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  capacityText: {
    color: colors.primary[200],
  },
  bold: {
    fontFamily: fonts.bold,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  details: {
    color: colors.accent[400],
  },
});
