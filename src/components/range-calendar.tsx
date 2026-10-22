import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { BookedRange } from "@/lib/bookings";
import { haptics } from "@/lib/haptics";

// Pick check-in and check-out days. A booking occupies the nights from its start up to (not
// including) its end, so a check-out day is free for the next check-in, matching
// create_booking in docs/sql/02-booking-rpcs.sql. Tap a check-in day, then a check-out day.

export type DateRange = { start?: Date; end?: Date };

type Props = {
  bookedRanges: BookedRange[];
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxNights: number;
};

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

export function RangeCalendar({ bookedRanges, value, onChange, maxNights }: Props) {
  const today = startOfToday();
  const [month, setMonth] = useState(() => startOfMonth(value.start ?? today));

  const bookedNights = new Set(
    bookedRanges.flatMap(({ start_date, end_date }) => {
      const start = parseISO(start_date);
      const lastNight = addDays(parseISO(end_date), -1);
      return isBefore(lastNight, start) ? [] : eachDayOfInterval({ start, end: lastNight }).map(dayKey);
    }),
  );

  const isFree = (night: Date) => !bookedNights.has(dayKey(night));
  const canStart = (day: Date) => isAfter(day, today) && isFree(day);
  const canEnd = (start: Date, day: Date) => {
    const nights = differenceInCalendarDays(day, start);
    if (nights < 1 || nights > maxNights) return false;
    return eachDayOfInterval({ start, end: addDays(day, -1) }).every(isFree);
  };

  function handlePress(day: Date) {
    const { start, end } = value;
    if (start && !end && canEnd(start, day)) onChange({ start, end: day });
    else if (canStart(day)) onChange({ start: day });
    else return;
    haptics.selection();
  }

  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  const leadingBlanks = getISODay(month) - 1;
  const canGoBack = isAfter(month, startOfMonth(today));

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <MonthButton label="‹" disabled={!canGoBack} onPress={() => setMonth(addMonths(month, -1))} />
        <Text style={styles.month}>{format(month, "MMMM yyyy")}</Text>
        <MonthButton label="›" onPress={() => setMonth(addMonths(month, 1))} />
      </View>

      <View style={styles.grid}>
        {weekdays.map((weekday) => (
          <Text key={weekday} style={[styles.cell, styles.weekday]}>
            {weekday}
          </Text>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const { start, end } = value;
          const isEndpoint = (start && isSameDay(day, start)) || (end && isSameDay(day, end));
          const inRange = start && end && isAfter(day, start) && isBefore(day, end);
          const selectable = (start && !end && canEnd(start, day)) || canStart(day);
          const booked = !isFree(day) && isAfter(day, today);

          return (
            <Pressable
              key={dayKey(day)}
              onPress={() => handlePress(day)}
              disabled={!selectable}
              accessibilityRole="button"
              accessibilityLabel={format(day, "EEEE, MMMM d")}
              accessibilityState={{ disabled: !selectable, selected: !!isEndpoint }}
              style={[styles.cell, inRange && styles.inRange, isEndpoint && styles.endpoint]}
            >
              <Text
                style={[
                  styles.day,
                  !selectable && styles.dayDisabled,
                  booked && styles.dayBooked,
                  isEndpoint && styles.dayEndpoint,
                ]}
              >
                {format(day, "d")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, styles.dayBooked]}>12</Text>
        <Text style={styles.legendText}>booked</Text>
      </View>
    </View>
  );
}

function MonthButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === "‹" ? "Previous month" : "Next month"}
      hitSlop={8}
      style={styles.monthButton}
    >
      <Text style={[styles.monthArrow, disabled && styles.dayDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  calendar: {
    borderWidth: 1,
    borderColor: colors.primary[800],
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  month: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: colors.primary[100],
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrow: {
    fontSize: 28,
    color: colors.accent[400],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: {
    fontSize: 13,
    color: colors.primary[400],
    textAlign: "center",
    textAlignVertical: "center",
  },
  inRange: {
    backgroundColor: colors.accent[900],
  },
  endpoint: {
    backgroundColor: colors.accent[500],
  },
  day: {
    fontSize: 16,
    color: colors.primary[100],
  },
  dayDisabled: {
    color: colors.primary[700],
  },
  dayBooked: {
    color: colors.primary[600],
    textDecorationLine: "line-through",
  },
  dayEndpoint: {
    fontFamily: fonts.bold,
    color: colors.primary[900],
    textDecorationLine: "none",
  },
  legend: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
  },
  legendText: {
    fontSize: 13,
    color: colors.primary[400],
  },
});
