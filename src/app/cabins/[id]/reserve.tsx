import { differenceInCalendarDays, format } from "date-fns";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Field, Input, Stepper } from "@/components/form";
import { RangeCalendar, type DateRange } from "@/components/range-calendar";
import { ErrorState, Loading } from "@/components/screen-state";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useAuth } from "@/lib/auth";
import { useBookedDates, useCreateBooking, useSettings } from "@/lib/bookings";
import { useCabin } from "@/lib/cabins";
import { useGuest } from "@/lib/guest";

const formatDay = (date: Date) => format(date, "EEE, MMM d yyyy");

export default function ReserveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cabinId = Number(id);
  const { session } = useAuth();

  const cabin = useCabin(cabinId);
  const settings = useSettings();
  const bookedDates = useBookedDates(cabinId);
  // Makes sure the guest row exists; create_booking looks the guest up by email
  const guest = useGuest(session?.user);
  const createBooking = useCreateBooking();

  const [range, setRange] = useState<DateRange>({});
  const [numGuests, setNumGuests] = useState(1);
  const [observations, setObservations] = useState("");

  if (!session) return <SignInPrompt message="Sign in with Google to reserve this cabin." />;

  const loading = [cabin, settings, bookedDates, guest].find((query) => query.isPending);
  const failed = [cabin, settings, bookedDates, guest].find((query) => query.error);
  if (failed?.error) return <ErrorState message={failed.error.message} onRetry={() => failed.refetch()} />;
  if (loading || !cabin.data || !settings.data || !bookedDates.data) return <Loading />;

  const { name, maxCapacity, regularPrice, discount } = cabin.data;
  const { minBookingLength, maxBookingLength, maxGuestsPerBooking } = settings.data;
  const maxGuests = Math.min(maxCapacity, maxGuestsPerBooking);
  const minNights = Math.max(minBookingLength, 1);
  const pricePerNight = regularPrice - discount;

  const { start, end } = range;
  const nights = start && end ? differenceInCalendarDays(end, start) : 0;
  const tooShort = nights > 0 && nights < minNights;

  if (createBooking.isSuccess && start && end) {
    return (
      <View style={styles.done}>
        <Stack.Screen options={{ title: "Reserved" }} />
        <Text style={styles.title}>Thank you!</Text>
        <Text style={styles.doneText}>
          Cabin {name} is reserved for {nights} night{nights > 1 ? "s" : ""}, {formatDay(start)} to{" "}
          {formatDay(end)}.
        </Text>
        <Button label="View my reservations" onPress={() => router.replace("/reservations")} />
        <Button label="Back to cabins" variant="secondary" onPress={() => router.dismissTo("/")} />
      </View>
    );
  }

  let dateHint = `Stays are ${minNights} to ${maxBookingLength} nights.`;
  if (!start) dateHint = "Tap your check-in day.";
  else if (!end) dateHint = "Now tap your check-out day.";
  else if (tooShort) dateHint = `The minimum stay is ${minNights} nights.`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: `Reserve Cabin ${name}` }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Dates" hint={dateHint}>
          <RangeCalendar
            bookedRanges={bookedDates.data}
            value={range}
            onChange={setRange}
            maxNights={maxBookingLength}
          />
        </Field>

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

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            ${pricePerNight} × {nights} night{nights === 1 ? "" : "s"}
          </Text>
          <Text style={styles.total}>${pricePerNight * nights}</Text>
        </View>

        {createBooking.error && <Text style={styles.error}>{createBooking.error.message}</Text>}

        <Button
          label={nights ? "Reserve now" : "Select your dates"}
          busy={createBooking.isPending}
          onPress={() => {
            if (!start || !end || tooShort) return;
            createBooking.mutate({ cabinId, startDate: start, endDate: end, numGuests, observations });
          }}
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
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.primary[800],
    paddingTop: 16,
  },
  summaryText: {
    color: colors.primary[200],
  },
  total: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.accent[400],
  },
  error: {
    color: colors.accent[300],
    textAlign: "center",
  },
  done: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    color: colors.accent[400],
  },
  doneText: {
    color: colors.primary[200],
    textAlign: "center",
    lineHeight: 22,
  },
});
