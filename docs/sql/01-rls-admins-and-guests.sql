-- Phase 2a: split admins from guests.
-- Before: every `authenticated` user could read/write every table and bucket.
-- After:
--   admins (app_metadata.role = 'admin'): full access, as before (admin app keeps working)
--   anon + guests: read cabins and settings
--   guests: read/insert/update only their own `guests` row (matched by JWT email),
--           read their own bookings, cancel their own future bookings
--   creating/editing bookings goes through RPCs (02-booking-rpcs.sql), not direct writes
-- Run once in Supabase → SQL Editor. Admins must log out and in again to get the new claim.

begin;

-- 1. Mark the admin. app_metadata can only be written server-side (users can edit user_metadata).
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'dave@mail.com';

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- 2. Drop the course's "Enable … for all users" policies.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where (schemaname = 'public' and tablename in ('cabins', 'bookings', 'guests', 'settings'))
       or (schemaname = 'storage' and tablename = 'objects'
           and (policyname like 'Allow access for auth users 1oj01fe_%'
                or policyname like 'Allow all operations qy2d3w_%'))
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 3. Admins: everything (tables + both buckets).
create policy "Admins: all" on public.cabins for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins: all" on public.bookings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins: all" on public.guests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins: all" on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins: all on admin buckets" on storage.objects for all to authenticated
  using (bucket_id in ('avatars', 'cabin-images') and (select public.is_admin()))
  with check (bucket_id in ('avatars', 'cabin-images') and (select public.is_admin()));

-- 4. Public read: cabins and settings. (Image files are served from the public bucket URL.)
create policy "Everyone: read cabins" on public.cabins for select to anon, authenticated
  using (true);
create policy "Everyone: read settings" on public.settings for select to anon, authenticated
  using (true);

-- 5. Guests: own profile row, matched by the verified email in the JWT.
create policy "Guests: read own profile" on public.guests for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "Guests: create own profile" on public.guests for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "Guests: update own profile" on public.guests for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- 6. Guests: own bookings. Read all of them; delete (cancel) only future ones.
--    The guests subquery is itself filtered by the "read own profile" policy.
create policy "Guests: read own bookings" on public.bookings for select to authenticated
  using ("guestId" in (select id from public.guests));
create policy "Guests: cancel own future bookings" on public.bookings for delete to authenticated
  using ("guestId" in (select id from public.guests) and "startDate" > now());

-- 7. Defense in depth: anon never writes; TRUNCATE ignores RLS, so nobody gets it via the API.
revoke insert, update, delete, truncate, references, trigger
  on public.cabins, public.bookings, public.guests, public.settings from anon;
revoke truncate, references, trigger
  on public.cabins, public.bookings, public.guests, public.settings from authenticated;

commit;
