import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuth } from "@/lib/auth";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";

// Guests read and cancel their own bookings directly (RLS), but create and edit them only
// through the RPCs in docs/sql/02-booking-rpcs.sql, which price and validate server-side.
// RPC errors are user-facing messages ("Cabin is not available for these dates").

export type Booking = {
  id: number;
  created_at: string;
  startDate: string;
  endDate: string;
  numNights: number;
  numGuests: number;
  totalPrice: number;
  status: "unconfirmed" | "checked-in" | "checked-out";
  observations: string | null;
  cabinId: number;
  cabins: { name: string; image: string; maxCapacity: number };
};

export type Settings = {
  minBookingLength: number;
  maxBookingLength: number;
  maxGuestsPerBooking: number;
};

export type BookedRange = { start_date: string; end_date: string };

const bookingColumns =
  "id, created_at, startDate, endDate, numNights, numGuests, totalPrice, status, observations, cabinId, cabins(name, image, maxCapacity)";

// Dates go to the RPCs as plain calendar days
const toDay = (date: Date) => format(date, "yyyy-MM-dd");

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await supabase
        .from("settings")
        .select("minBookingLength, maxBookingLength, maxGuestsPerBooking")
        .single();
      if (error) throw new Error("Settings could not be loaded");
      return data;
    },
  });
}

export function useMyBookings() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["bookings", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select(bookingColumns)
        .order("startDate", { ascending: false });
      if (error) throw new Error("Reservations could not be loaded");
      return data as unknown as Booking[];
    },
  });
}

export function useBookedDates(cabinId: number) {
  return useQuery({
    queryKey: ["booked-dates", cabinId],
    queryFn: async (): Promise<BookedRange[]> => {
      const { data, error } = await supabase.rpc("get_booked_dates", { p_cabin_id: cabinId });
      if (error) throw new Error("Availability could not be loaded");
      return data;
    },
  });
}

type NewBooking = {
  cabinId: number;
  startDate: Date;
  endDate: Date;
  numGuests: number;
  observations: string;
};

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: NewBooking): Promise<number> => {
      const { data, error } = await supabase.rpc("create_booking", {
        p_cabin_id: booking.cabinId,
        p_start_date: toDay(booking.startDate),
        p_end_date: toDay(booking.endDate),
        p_num_guests: booking.numGuests,
        p_observations: booking.observations,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: haptics.success,
    onError: haptics.error,
    onSettled: (_id, _error, booking) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booked-dates", booking.cabinId] });
    },
  });
}

type BookingUpdate = { id: number; numGuests: number; observations: string };

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, numGuests, observations }: BookingUpdate) => {
      const { error } = await supabase.rpc("update_booking", {
        p_booking_id: id,
        p_num_guests: numGuests,
        p_observations: observations,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: haptics.success,
    onError: haptics.error,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

// Removes the booking from the list right away and puts it back if the delete fails
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const queryKey = ["bookings", session?.user.id];

  return useMutation({
    mutationFn: async (booking: Booking) => {
      // RLS only lets guests delete their own upcoming bookings; anything else deletes 0 rows
      const { data, error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", booking.id)
        .select("id");
      if (error || !data.length) throw new Error("Reservation could not be cancelled");
    },
    onMutate: async (booking) => {
      haptics.warning();
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Booking[]>(queryKey);
      queryClient.setQueryData<Booking[]>(queryKey, (bookings) =>
        bookings?.filter(({ id }) => id !== booking.id),
      );
      return { previous };
    },
    onError: (_error, _booking, context) => {
      haptics.error();
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: (_data, _error, booking) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["booked-dates", booking.cabinId] });
    },
  });
}
