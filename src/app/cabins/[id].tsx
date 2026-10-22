import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/icon";
import { Price } from "@/components/price";
import { ErrorState, Loading } from "@/components/screen-state";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useCabin } from "@/lib/cabins";
import { isNotFound } from "@/lib/errors";

export default function CabinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cabin, error, isPending, refetch } = useCabin(Number(id));

  if (isPending) return <Loading />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        onRetry={isNotFound(error) ? undefined : refetch}
      />
    );

  const { name, maxCapacity, regularPrice, discount, image, description } = cabin;

  return (
    <>
      <Stack.Screen options={{ title: `Cabin ${name}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={image}
          style={styles.image}
          transition={{ duration: 300, effect: "cross-dissolve" }}
          accessibilityLabel={`Cabin ${name}`}
        />
        <View style={styles.body}>
          <Text style={styles.name}>Cabin {name}</Text>
          <Price regularPrice={regularPrice} discount={discount} />

          <View style={styles.facts}>
            <Fact icon="guests">
              For up to <Text style={styles.bold}>{maxCapacity}</Text> guests
            </Fact>
            <Fact icon="location">
              Located in the heart of the <Text style={styles.bold}>Dolomites</Text> (Italy)
            </Fact>
            <Fact icon="privacy">
              Privacy <Text style={styles.bold}>100%</Text> guaranteed
            </Fact>
          </View>

          <Text style={styles.description}>{description}</Text>
        </View>
      </ScrollView>
    </>
  );
}

function Fact({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} color={colors.primary[600]} />
      <Text style={styles.factText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: 32,
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.primary[900],
  },
  body: {
    padding: 20,
    gap: 16,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.accent[100],
  },
  facts: {
    gap: 12,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  factText: {
    flex: 1,
    fontSize: 17,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  description: {
    color: colors.primary[300],
    fontSize: 17,
    lineHeight: 26,
  },
});
