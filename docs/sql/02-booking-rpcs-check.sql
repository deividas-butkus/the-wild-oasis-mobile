-- Verify 02-booking-rpcs.sql by calling the RPCs as anon, a guest and a non-guest user.
-- Everything runs in one transaction that is rolled back: no data changes.
-- Each case records "ok …" or the error message; the "expect" column says which is right.

begin;

create temp table rpc_check (step int, who text, test text, expect text, result text) on commit drop;
grant insert on rpc_check to anon, authenticated;

-- Test inputs, picked as postgres. Dates ~400 days out should be free.
select set_config('check.cabin', (select min(id)::text from public.cabins), true);
select set_config('check.start', (current_date + 400)::text, true);
select set_config('check.end',
  (current_date + 400 + (select greatest("minBookingLength", 1) from public.settings limit 1))::text, true);
select set_config('check.guest_email',
  (select g.email from public.guests g join public.bookings b on b."guestId" = g.id limit 1), true);
select set_config('check.other_booking',
  (select b.id::text from public.bookings b join public.guests g on g.id = b."guestId"
   where g.email <> current_setting('check.guest_email') limit 1), true);

-- anon
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  insert into rpc_check values (1, 'anon', 'get_booked_dates', 'ok',
    'ok: ' || (select count(*) from public.get_booked_dates(current_setting('check.cabin')::bigint)) || ' ranges');
exception when others then insert into rpc_check values (1, 'anon', 'get_booked_dates', 'ok', sqlerrm); end $$;
do $$ begin
  perform public.create_booking(current_setting('check.cabin')::bigint,
    current_setting('check.start')::date, current_setting('check.end')::date, 1, '');
  insert into rpc_check values (2, 'anon', 'create_booking', 'permission denied', 'ok');
exception when others then insert into rpc_check values (2, 'anon', 'create_booking', 'permission denied', sqlerrm); end $$;
reset role;

-- signed-in user without a guest row
select set_config('request.jwt.claims',
  '{"role":"authenticated","email":"ozzy@mail.com","app_metadata":{}}', true);
set local role authenticated;
do $$ begin
  perform public.create_booking(current_setting('check.cabin')::bigint,
    current_setting('check.start')::date, current_setting('check.end')::date, 1, '');
  insert into rpc_check values (3, 'no guest row', 'create_booking', 'no guest profile', 'ok');
exception when others then insert into rpc_check values (3, 'no guest row', 'create_booking', 'no guest profile', sqlerrm); end $$;
reset role;

-- guest
select set_config('request.jwt.claims', json_build_object(
  'role', 'authenticated', 'app_metadata', '{}'::json, 'email', current_setting('check.guest_email')
)::text, true);
set local role authenticated;
do $$
declare v_id bigint;
begin
  v_id := public.create_booking(current_setting('check.cabin')::bigint,
    current_setting('check.start')::date, current_setting('check.end')::date, 1, 'check');
  perform set_config('check.new_id', v_id::text, true);
  insert into rpc_check
  select 4, 'guest', 'create_booking (valid)', 'ok, total = nights × (price − discount)',
         format('ok: %s nights, total %s, status %s, paid %s',
                b."numNights", b."totalPrice", b.status, b."isPaid")
  from public.bookings b where b.id = v_id;
exception when others then insert into rpc_check values (4, 'guest', 'create_booking (valid)', 'ok', sqlerrm); end $$;
insert into rpc_check
select 4, 'guest', '  expected total', '', 'ok: ' || (current_setting('check.end')::date - current_setting('check.start')::date)
       * (c."regularPrice" - coalesce(c.discount, 0))
from public.cabins c where c.id = current_setting('check.cabin')::bigint;
do $$ begin
  perform public.create_booking(current_setting('check.cabin')::bigint,
    current_setting('check.start')::date, current_setting('check.end')::date, 1, '');
  insert into rpc_check values (5, 'guest', 'create_booking (same dates)', 'not available', 'ok');
exception when others then insert into rpc_check values (5, 'guest', 'create_booking (same dates)', 'not available', sqlerrm); end $$;
do $$ begin
  perform public.create_booking(current_setting('check.cabin')::bigint,
    current_setting('check.start')::date + 100, current_setting('check.end')::date + 100, 99, '');
  insert into rpc_check values (6, 'guest', 'create_booking (99 guests)', 'guests must be 1 to N', 'ok');
exception when others then insert into rpc_check values (6, 'guest', 'create_booking (99 guests)', 'guests must be 1 to N', sqlerrm); end $$;
do $$ begin
  perform public.create_booking(current_setting('check.cabin')::bigint,
    current_date - 10, current_date - 5, 1, '');
  insert into rpc_check values (7, 'guest', 'create_booking (past)', 'start in the future', 'ok');
exception when others then insert into rpc_check values (7, 'guest', 'create_booking (past)', 'start in the future', sqlerrm); end $$;
do $$ begin
  perform public.update_booking(current_setting('check.new_id')::bigint, 2, 'changed');
  insert into rpc_check
  select 8, 'guest', 'update_booking (own)', 'ok, 2 guests',
         format('ok: %s guests, "%s"', "numGuests", observations)
  from public.bookings where id = current_setting('check.new_id')::bigint;
exception when others then insert into rpc_check values (8, 'guest', 'update_booking (own)', 'ok', sqlerrm); end $$;
do $$ begin
  perform public.update_booking(current_setting('check.other_booking')::bigint, 1, 'hijack');
  insert into rpc_check values (9, 'guest', 'update_booking (someone else''s)', 'booking not found', 'ok');
exception when others then insert into rpc_check values (9, 'guest', 'update_booking (someone else''s)', 'booking not found', sqlerrm); end $$;
with d as (delete from public.bookings where id = current_setting('check.new_id', true)::bigint returning 1)
insert into rpc_check select 10, 'guest', 'cancel own future booking', 'ok: 1 deleted', 'ok: ' || count(*) || ' deleted' from d;
reset role;

select * from rpc_check order by step, test;

rollback;
