import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/form";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import countries from "@/data/countries.json";

// Same list as the website (copied from its app/_lib/countries.json); flags are flagcdn SVGs
export type Country = { name: string; flag: string };

type Props = { value: Country | null; onChange: (country: Country) => void };

export function CountryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shown = countries.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityHint="Opens the country list"
        style={styles.field}
      >
        {value && <Image source={value.flag} style={styles.flag} contentFit="contain" />}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value?.name ?? "Select country…"}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Where are you from?</Text>
            <Pressable onPress={close} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            autoCorrect={false}
            autoFocus
          />
          <FlatList
            data={shown}
            keyExtractor={(c) => c.name}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  close();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Image source={item.flag} style={styles.flag} contentFit="contain" />
                <Text style={[styles.value, item.name === value?.name && styles.selected]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.primary[900],
    borderWidth: 1,
    borderColor: colors.primary[800],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flag: {
    width: 30,
    height: 20,
  },
  value: {
    flex: 1,
  },
  placeholder: {
    color: colors.primary[500],
  },
  chevron: {
    fontSize: 22,
    color: colors.primary[400],
  },
  modal: {
    flex: 1,
    backgroundColor: colors.primary[950],
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.accent[400],
  },
  close: {
    color: colors.accent[400],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[900],
  },
  rowPressed: {
    backgroundColor: colors.primary[900],
  },
  selected: {
    fontFamily: fonts.bold,
    color: colors.accent[400],
  },
});
