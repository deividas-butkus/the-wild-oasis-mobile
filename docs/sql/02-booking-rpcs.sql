-- Phase 2b: booking RPCs for guests (called via supabase.rpc from the app).
-- Guests have no direct insert/update on bookings (see 01): these functions are the only way,
-- so prices, status and payment are decided here, not by the client.
--   get_booked_dates(cabin)        anon + authenticated: date ranges only, no guest data
--   create_booking(...)            authenticated guests: validates and prices server-side
--   update_booking(id, guests, obs) authenticated guests: own, upcoming, unconfirmed only
-- Cancelling is a plain delete, allowed by the "cancel own future bookings" policy in 01.
-- Run once in Supabase → SQL Editor, then verify with 02-booking-rpcs-check.sql.

begin;

-- Same rule as the website's getBookedDatesByCabinId: upcoming stays plus current check-ins.
create or replace function public.get_booked_dates(p_cabin_id bigint)
returns table (start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select b."startDate"::date, b."endDate"::date
  from public.bookings b
  where b."cabinId" = p_cabin_id
    and (b."startDate"::date >= current_date or b.status = 'checked-in')
  order by 1
$$;

create or replace function public.create_booking(
  p_cabin_id bigint,
  p_start_date date,
  p_end_date date,
  p_num_guests int,
  p_observations text default ''
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest_id bigint;
  v_cabin record;
  v_settings record;
  v_nights int := p_end_date - p_start_date;
  v_max_guests int;
  v_cabin_price numeric;
  v_id bigint;
begin
  select id into v_guest_id
  from public.guests
  where lower(email) = lower(auth.jwt() ->> 'email');
  if v_guest_id is null then
    raise exception 'No guest profile for this account';
  end if;

  select "regularPrice", coalesce(discount, 0) as discount, "maxCapacity" into v_cabin
  from public.cabins
  where id = p_cabin_id;
  if not found then
    raise exception 'Cabin not found';
  end if;

  select "minBookingLength", "maxBookingLength", "maxGuestsPerBooking" into v_settings
  from public.settings
  limit 1;

  if p_start_date is null or p_end_date is null or p_start_date <= current_date then
    raise exception 'Start date must be in the future';
  end if;
  if v_nights < greatest(v_settings."minBookingLength", 1)
     or v_nights > v_settings."maxBookingLength" then
    raise exception 'Stay must be % to % nights',
      greatest(v_settings."minBookingLength", 1), v_settings."maxBookingLength";
  end if;

  v_max_guests := least(v_cabin."maxCapacity", v_settings."maxGuestsPerBooking");
  if p_num_guests is null or p_num_guests < 1 or p_num_guests > v_max_guests then
    raise exception 'Number of guests must be 1 to %', v_max_guests;
  end if;
  if length(coalesce(p_observations, '')) > 1000 then
    raise exception 'Observations must be at most 1000 characters';
  end if;

  -- One booking per cabin at a time, so two requests can't both pass the overlap check.
  -- (The website and admin app insert directly and don't take this lock.)
  perform pg_advisory_xact_lock(p_cabin_id);

  -- Check-out day is free for the next check-in.
  if exists (
    select 1 from public.bookings b
    where b."cabinId" = p_cabin_id
      and b.status <> 'checked-out'
      and b."startDate"::date < p_end_date
      and b."endDate"::date > p_start_date
  ) then
    raise exception 'Cabin is not available for these dates';
  end if;

  v_cabin_price := v_nights * (v_cabin."regularPrice" - v_cabin.discount);

  insert into public.bookings (
    "cabinId", "guestId", "startDate", "endDate", "numNights", "numGuests",
    "cabinPrice", "extrasPrice", "totalPrice", "hasBreakfast", "isPaid", status, observations
  )
  values (
    p_cabin_id, v_guest_id, p_start_date, p_end_date, v_nights, p_num_guests,
    v_cabin_price, 0, v_cabin_price, false, false, 'unconfirmed', coalesce(p_observations, '')
  )
  returning id into v_id;

  return v_id;
end
$$;

create or replace function public.update_booking(
  p_booking_id bigint,
  p_num_guests int,
  p_observations text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
  v_max_guests int;
begin
  select b."startDate", b.status, c."maxCapacity" into v_booking
  from public.bookings b
  join public.guests g on g.id = b."guestId"
  join public.cabins c on c.id = b."cabinId"
  where b.id = p_booking_id
    and lower(g.email) = lower(auth.jwt() ->> 'email');
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking."startDate" <= now() or v_booking.status <> 'unconfirmed' then
    raise exception 'Only upcoming, unconfirmed bookings can be changed';
  end if;

  select least(v_booking."maxCapacity", s."maxGuestsPerBooking") into v_max_guests
  from public.settings s
  limit 1;
  if p_num_guests is null or p_num_guests < 1 or p_num_guests > v_max_guests then
    raise exception 'Number of guests must be 1 to %', v_max_guests;
  end if;
  if length(coalesce(p_observations, '')) > 1000 then
    raise exception 'Observations must be at most 1000 characters';
  end if;

  update public.bookings
  set "numGuests" = p_num_guests, observations = coalesce(p_observations, '')
  where id = p_booking_id;
end
$$;

-- New functions are executable by PUBLIC, and Supabase also grants anon/authenticated by default.
revoke execute on function public.get_booked_dates(bigint) from public;
revoke execute on function public.create_booking(bigint, date, date, int, text) from public, anon;
revoke execute on function public.update_booking(bigint, int, text) from public, anon;
grant execute on function public.get_booked_dates(bigint) to anon, authenticated;
grant execute on function public.create_booking(bigint, date, date, int, text) to authenticated;
grant execute on function public.update_booking(bigint, int, text) to authenticated;

commit;
