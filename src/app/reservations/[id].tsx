import { format, parseISO } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { Button } from "@/components/button";
import { Field, Input, Stepper } from "@/components/form";
import { ErrorState, Loading } from "@/components/screen-state";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useMyBookings, useSettings, useUpdateBooking, type Booking } from "@/lib/bookings";

export default function EditReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookings = useMyBookings();
  const settings = useSettings();

  if (bookings.isPending || settings.isPending) return <Loading />;
  if (bookings.error) return <ErrorState message={bookings.error.message} onRetry={bookings.refetch} />;
  if (settings.error) return <ErrorState message={settings.error.message} onRetry={settings.refetch} />;

  const booking = bookings.data.find((b) => b.id === Number(id));
  if (!booking) return <ErrorState message="Reservation not found" />;

  const maxGuests = Math.min(booking.cabins.maxCapacity, settings.data.maxGuestsPerBooking);
  return <EditForm booking={booking} maxGuests={maxGuests} />;
}

function EditForm({ booking, maxGuests }: { booking: Booking; maxGuests: number }) {
  const [numGuests, setNumGuests] = useState(booking.numGuests);
  const [observations, setObservations] = useState(booking.observations ?? "");
  const update = useUpdateBooking();

  const { cabins, startDate, endDate } = booking;
  const day = (date: string) => format(parseISO(date), "EEE, MMM d yyyy");

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Cabin {cabins.name}</Text>
        <Text style={styles.dates}>
          {day(startDate)} — {day(endDate)}
        </Text>

        <Field label="Guests" hint={`Up to ${maxGuests} guests in this cabin.`}>
          <Stepper value={numGuests} min={1} max={maxGuests} onChange={setNumGuests} />
        </Field>

        <Field label="Anything we should know about your stay?">
          <Input
            value={observations}
            onChangeText={setObservations}
            placeholder="Pets, allergies, special requirements, etc."
            multiline
            maxLength={1000}
          />
        </Field>

        {update.error && <Text style={styles.error}>{update.error.message}</Text>}

        <Button
          label="Save changes"
          busy={update.isPending}
          onPress={() =>
            update.mutate(
              { id: booking.id, numGuests, observations },
              { onSuccess: () => router.back() },
            )
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 20,
    gap: 24,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.accent[400],
    marginBottom: -16,
  },
  dates: {
    color: colors.primary[300],
  },
  error: {
    color: colors.accent[300],
    textAlign: "center",
  },
});
