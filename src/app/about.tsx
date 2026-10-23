import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useCabins } from "@/lib/cabins";

// The website's About page, shortened for a phone. No link to the website: it isn't built for
// phone screens.
export default function AboutScreen() {
  // Usually cached already by the Cabins tab
  const { data: cabins } = useCabins();
  const ourCabins = cabins ? `Our ${cabins.length} luxury cabins` : "Our luxury cabins";

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image
        source={require("@/assets/images/about-1.jpg")}
        style={styles.image}
        accessibilityLabel="Family sitting around a fire pit in front of cabin"
      />
      <View style={styles.section}>
        <Text style={styles.title}>Welcome to The Wild Oasis</Text>
        <Text style={styles.text}>
          Where nature&apos;s beauty and comfortable living blend seamlessly. Hidden away in the
          heart of the Italian Dolomites, this is your paradise away from home. It&apos;s about
          the experience of reconnecting with nature and enjoying simple pleasures with family.
        </Text>
        <Text style={styles.text}>
          {ourCabins} provide a cozy base, but the real freedom and peace you&apos;ll find in the
          surrounding mountains. Wander through lush forests, breathe in the fresh air, and watch
          the stars twinkle above from the warmth of a campfire or your hot tub.
        </Text>
      </View>

      <Image
        source={require("@/assets/images/about-2.jpg")}
        style={styles.image}
        accessibilityLabel="Family that manages The Wild Oasis"
      />
      <View style={styles.section}>
        <Text style={styles.title}>Managed by our family since 1962</Text>
        <Text style={styles.text}>
          Started by our grandparents, this haven has been nurtured with love and care, passing
          down through our family. Here, you&apos;re not just a guest; you&apos;re part of our
          extended family. Join us soon, where tradition meets tranquility, and every visit is
          like coming home.
        </Text>
      </View>

      <Button label="Explore our luxury cabins" onPress={() => router.navigate("/")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  section: {
    gap: 14,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.accent[400],
  },
  text: {
    color: colors.primary[200],
    lineHeight: 24,
  },
});
