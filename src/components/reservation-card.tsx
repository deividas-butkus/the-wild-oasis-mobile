import { format, formatDistanceToNow, isPast, isToday, parseISO } from "date-fns";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useCancelBooking, type Booking } from "@/lib/bookings";

const formatDay = (date: string) => format(parseISO(date), "EEE, MMM d yyyy");

function fromNow(date: string) {
  if (isToday(parseISO(date))) return "today";
  return formatDistanceToNow(parseISO(date), { addSuffix: true }).replace("about ", "");
}

export function ReservationCard({ booking }: { booking: Booking }) {
  const { id, startDate, endDate, numNights, numGuests, totalPrice, created_at, cabins } = booking;
  const upcoming = !isPast(parseISO(startDate));
  const cancel = useCancelBooking();
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Image source={cabins.image} style={styles.image} recyclingKey={String(id)} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {numNights} night{numNights > 1 ? "s" : ""} in Cabin {cabins.name}
            </Text>
            <Text style={[styles.badge, upcoming ? styles.upcoming : styles.past]}>
              {upcoming ? "upcoming" : "past"}
            </Text>
          </View>
          <Text style={styles.dates}>
            {formatDay(startDate)} ({fromNow(startDate)}) — {formatDay(endDate)}
          </Text>
          <Text style={styles.meta}>
            <Text style={styles.price}>${totalPrice}</Text> • {numGuests} guest{numGuests > 1 ? "s" : ""}
          </Text>
          <Text style={styles.booked}>Booked {format(parseISO(created_at), "MMM d yyyy, p")}</Text>
        </View>
      </View>

      {upcoming && (
        <View style={styles.actions}>
          {confirming ? (
            <>
              <Text style={styles.confirmText}>Cancel this reservation?</Text>
              <Action label="Keep" onPress={() => setConfirming(false)} />
              <Action label="Yes, cancel" danger onPress={() => cancel.mutate(booking)} />
            </>
          ) : (
            <>
              <Action
                label="Edit"
                onPress={() => router.push({ pathname: "/reservations/[id]", params: { id } })}
              />
              <Action label="Cancel" onPress={() => setConfirming(true)} />
            </>
          )}
        </View>
      )}
      {cancel.error && <Text style={styles.error}>{cancel.error.message}</Text>}
    </View>
  );
}

function Action({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Text style={[styles.actionLabel, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.primary[800],
  },
  top: {
    flexDirection: "row",
  },
  image: {
    width: 96,
    backgroundColor: colors.primary[900],
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 17,
  },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  upcoming: {
    backgroundColor: "#166534",
    color: "#BBF7D0",
  },
  past: {
    backgroundColor: "#854D0E",
    color: "#FEF08A",
  },
  dates: {
    fontSize: 14,
    color: colors.primary[300],
  },
  meta: {
    fontSize: 15,
    color: colors.primary[300],
  },
  price: {
    fontFamily: fonts.semiBold,
    color: colors.accent[400],
  },
  booked: {
    fontSize: 12,
    color: colors.primary[400],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.primary[800],
  },
  confirmText: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.primary[200],
  },
  action: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionPressed: {
    backgroundColor: colors.primary[900],
  },
  actionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    textTransform: "uppercase",
    color: colors.primary[300],
  },
  danger: {
    color: colors.accent[300],
  },
  error: {
    padding: 12,
    paddingTop: 0,
    fontSize: 14,
    color: colors.accent[300],
  },
});
