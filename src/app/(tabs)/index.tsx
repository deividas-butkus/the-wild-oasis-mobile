import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { CabinCard } from "@/components/cabin-card";
import { CapacityFilter } from "@/components/capacity-filter";
import { ErrorState, Loading } from "@/components/screen-state";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { capacityFilters, useCabins, type CapacityFilter as Filter } from "@/lib/cabins";

export default function CabinsScreen() {
  const { data: cabins, error, isPending, isRefetching, refetch } = useCabins();
  const [filter, setFilter] = useState<Filter>("all");

  if (isPending) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const matches = capacityFilters.find(({ key }) => key === filter)!.matches;
  const shown = cabins.filter(matches);

  return (
    <FlatList
      data={shown}
      keyExtractor={(cabin) => String(cabin.id)}
      renderItem={({ item }) => <CabinCard cabin={item} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.intro}>
            Cozy yet luxurious cabins, located right in the heart of the Italian Dolomites.
          </Text>
          <CapacityFilter value={filter} onChange={setFilter} />
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No cabins for this group size.</Text>}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.accent[500]}
          colors={[colors.accent[500]]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 16,
    gap: 20,
  },
  header: {
    gap: 16,
  },
  intro: {
    color: colors.primary[200],
    lineHeight: 22,
  },
  empty: {
    color: colors.primary[300],
    textAlign: "center",
    marginTop: 24,
  },
});
