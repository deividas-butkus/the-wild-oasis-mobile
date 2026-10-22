import { isPast, parseISO } from "date-fns";
import { router } from "expo-router";
import { RefreshControl, SectionList, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { ReservationCard } from "@/components/reservation-card";
import { ErrorState, Loading } from "@/components/screen-state";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useAuth } from "@/lib/auth";
import { useMyBookings } from "@/lib/bookings";

export default function ReservationsScreen() {
  const { session } = useAuth();
  const { data: bookings, error, isPending, isRefetching, refetch } = useMyBookings();

  if (!session) return <SignInPrompt message="Sign in with Google to see your reservations." />;
  if (isPending) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (!bookings.length)
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>You have no reservations yet.</Text>
        <Button label="Browse cabins" onPress={() => router.navigate("/")} />
      </View>
    );

  // Bookings come newest first; show upcoming soonest first
  const upcoming = bookings.filter((b) => !isPast(parseISO(b.startDate))).reverse();
  const past = bookings.filter((b) => isPast(parseISO(b.startDate)));
  const sections = [
    { title: "Upcoming", data: upcoming },
    { title: "Past", data: past },
  ].filter((section) => section.data.length);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(booking) => String(booking.id)}
      renderItem={({ item }) => <ReservationCard booking={item} />}
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.list}
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
    gap: 16,
  },
  section: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.accent[400],
    marginTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  emptyText: {
    color: colors.primary[200],
  },
});
