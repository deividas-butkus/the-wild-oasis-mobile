-- Verify 01-rls-admins-and-guests.sql by impersonating each kind of caller.
-- Everything runs in one transaction that is rolled back: no data changes.
-- Expected: anon and the non-admin see cabins/settings only and update 0 cabins;
-- the guest also sees their own guest row and bookings; the admin sees and updates everything.

begin;

create temp table rls_check (
  who text, cabins int, settings int, bookings int, guests int, cabins_updated int
) on commit drop;
grant insert on rls_check to anon, authenticated;

-- anon (logged out): no write privilege at all, so no update test
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
insert into rls_check
select 'anon', (select count(*) from public.cabins), (select count(*) from public.settings),
       (select count(*) from public.bookings), (select count(*) from public.guests), null;
reset role;

-- signed in, not an admin, no guest row (like a brand-new Google user)
select set_config('request.jwt.claims',
  '{"role":"authenticated","email":"ozzy@mail.com","app_metadata":{}}', true);
set local role authenticated;
with u as (update public.cabins set name = name returning 1)
insert into rls_check
select 'signed in, not admin', (select count(*) from public.cabins),
       (select count(*) from public.settings), (select count(*) from public.bookings),
       (select count(*) from public.guests), (select count(*) from u);
reset role;

-- signed in as a guest who has bookings
select set_config('request.jwt.claims', json_build_object(
  'role', 'authenticated', 'app_metadata', '{}'::json,
  'email', (select g.email from public.guests g join public.bookings b on b."guestId" = g.id limit 1)
)::text, true);
set local role authenticated;
with u as (update public.cabins set name = name returning 1)
insert into rls_check
select 'guest with bookings', (select count(*) from public.cabins),
       (select count(*) from public.settings), (select count(*) from public.bookings),
       (select count(*) from public.guests), (select count(*) from u);
reset role;

-- admin
select set_config('request.jwt.claims',
  '{"role":"authenticated","email":"dave@mail.com","app_metadata":{"role":"admin"}}', true);
set local role authenticated;
with u as (update public.cabins set name = name returning 1)
insert into rls_check
select 'admin', (select count(*) from public.cabins), (select count(*) from public.settings),
       (select count(*) from public.bookings), (select count(*) from public.guests),
       (select count(*) from u);
reset role;

select * from rls_check;

rollback;
