import { Pressable, ScrollView, StyleSheet } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { capacityFilters, type CapacityFilter as Filter } from "@/lib/cabins";
import { haptics } from "@/lib/haptics";

type Props = { value: Filter; onChange: (filter: Filter) => void };

export function CapacityFilter({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {capacityFilters.map(({ key, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  chipActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  label: {
    fontSize: 15,
    color: colors.primary[200],
  },
  labelActive: {
    color: colors.primary[50],
  },
});
