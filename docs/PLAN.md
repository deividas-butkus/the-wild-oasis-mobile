# The Wild Oasis Mobile: development plan

Guest-facing mobile app for The Wild Oasis (boutique cabin hotel), built on the **same Supabase
database** as the website. Purpose: a portfolio/demo project showing hands-on mobile work to an
employer: building, auth, data security (RLS), and distribution. Not intended for store release.

**Estimated effort:** ~1–1.5 weeks part-time. A read-only version (Phases 0–1) takes a weekend.

---

## Context (decided 2026-10-22)

| Topic | Decision |
|---|---|
| Framework | Expo SDK 58 + Expo Router (file routes in `src/app/`) + TypeScript |
| Styling | `StyleSheet` + tokens in `src/constants/colors.ts` (website palette). NativeWind optional: adopt only after checking its SDK 58 support in the docs |
| Backend | Supabase directly from the app with the **publishable/anon key** + RLS. No custom API |
| Auth | Supabase Auth with Google (website uses NextAuth; the app can't reuse that session) |
| Font | Josefin Sans (same as website) via `@expo-google-fonts/josefin-sans` |
| Node | 24 LTS via `.nvmrc` (`nvm use`); Expo SDK 58 needs ≥ 22.13 |
| Local devices | No Xcode or Android SDK on this Mac → use **Expo Go** on a phone, plus web (`npm run web`) |
| Distribution | Android APK via **EAS Build** (free tier) + screen recording; no store release |

### Related projects (sibling folders)

- `../vercel_the-wild-oasis-website`: Next.js 16 website (guest side). Live at
  https://the-wild-oasis-website-udemy.vercel.app. Data logic to mirror:
  `app/_lib/data-service.js`, `app/_lib/actions.js`. Uses the **service_role** key server-side,
  so it bypasses RLS and isn't affected by policy changes.
- `../vercel_the-wild-oasis`: the course's **admin dashboard**, same database. ⚠️ Check its
  Supabase key type and how it uses the tables **before changing RLS** (Phase 0). If it uses the
  anon key, tightening policies can break it.

### Database (Supabase project `umjziqypywdmvwglyegr`)

| Table | Columns | Rows |
|---|---|---|
| `cabins` | id, created_at, name, maxCapacity, regularPrice, discount, description, image | 8 |
| `bookings` | id, created_at, startDate, endDate, numNights, numGuests, cabinPrice, extrasPrice, totalPrice, status (`unconfirmed` / `checked-in` / `checked-out`), hasBreakfast, isPaid, observations, cabinId, guestId | 41 |
| `guests` | id, created_at, fullName, email, nationalID, nationality, countryFlag | 32 |
| `settings` | id, minBookingLength, maxBookingLength, maxGuestsPerBooking, breakfastPrice | 1 |

- Cabin images: public bucket `…supabase.co/storage/v1/object/public/cabin-images/<file>`.
- Guests are identified by **email** (unique). Booked dates for a cabin = bookings with
  `startDate >= today OR status = 'checked-in'`.
- Country list: copy `../vercel_the-wild-oasis-website/app/_lib/countries.json` (restcountries.com
  free API is dead). Flags are `https://flagcdn.com/<code>.svg`.
- Free Supabase projects pause after ~7 days idle; the website runs a daily keep-alive cron.

---

## Phases

### Phase 0: Setup ✅ done
- [x] Expo project (default template, reset), Supabase client (`src/lib/supabase.ts`, `.web.ts`)
- [x] Theme colors, dark app config, `.env.example`, `.nvmrc`, typecheck/lint passing
- [x] Legacy `anon` key in `.env.local` (2026-10-22). App runs on web and shows "Connected: 0 cabins visible"
- [x] RLS state as seen by the anon key: **all 4 tables return 0 rows, no error**. So RLS is
      enabled but no policy grants `anon` read access. Safe default; Phase 2 opens what's needed.
- [x] Check the admin app (`../vercel_the-wild-oasis`) (2026-10-22). Findings:
  - Vite SPA, **legacy anon key hardcoded** in `src/services/supabase.js`; email/password login
    (`signInWithPassword`), so every admin operation runs as the **`authenticated`** role.
  - Reads/writes as `authenticated`: `cabins` (select/insert/update/delete), `bookings`
    (select with `cabins`/`guests` joins, update, delete), `settings` (select/update), `guests`
    (insert/delete via the dev `Uploader`). Storage: uploads to `cabin-images` and `avatars`.
  - Its "Users" page calls `auth.signUp` (behind `ProtectedRoute`, but that is client-side only).
  - ⚠️ **Key risk for this app:** if the existing policies are the course's "allow all for
    `authenticated`", then any guest who signs in to the mobile app with Google gets the same
    JWT role as an admin and could read every guest's data and edit/delete any booking or cabin
    through the API. Phase 2 must separate admins from guests (see there).
- [x] Inspect existing policies/grants: ran `docs/sql/00-inspect-security.sql` (2026-10-22). Results:
  - RLS **enabled** on all 5 public tables: `cabins`, `bookings`, `guests`, `settings`, and
    `contact` (not in the schema above, not used by the website or admin app, no policies).
  - Grants: `anon` and `authenticated` have **all** privileges on every table (Supabase
    default), so RLS policies are the only protection.
  - Policies: `cabins`, `bookings`, `guests`, `settings` each have select/insert/update/delete
    for **`authenticated` with `true`** (the course's "Enable … for all users"). Nothing for `anon`.
  - Storage: `avatars` and `cabin-images` buckets: all operations for `authenticated`.
  - No functions in `public`.
  - Auth users: 3, all email/password, created 2025-07-07, none with an `app_metadata.role`.
- [x] Auth settings: "Allow new users to sign up" **on**, "Confirm email" on, anonymous sign-ins
      off; Email provider enabled, **Google disabled**.
- ⚠️ **Confirmed: open hole today, independent of this app.** Anyone with the public anon key
  (it's in the admin app's JS bundle) can sign up with any email address they can receive mail
  at, confirm it, and then read every guest's data and edit or delete all bookings, cabins and
  settings. Turning sign-ups off isn't the fix, because Google sign-in (Phase 3) needs them on to
  create new users. The fix is the admin/guest split in Phase 2, which is now the top priority.
- **Incident (found 2026-10-22):** one of the 3 auth users wasn't created by the owner. The audit
  log shows a stranger signed up with a disposable email on 2025-07-07, confirmed it and stayed
  signed in ~12 min, no IP recorded. With the policies above it had full read/write. What it read
  or changed can't be known (no row history; free-plan DB logs last ~1 day). Response: account
  deleted by the owner (2026-10-22); sign-ups turned off until Phase 2 is live and Phase 3 needs
  them (re-enable then); Phase 2 closes the hole. The other 2 users are the owner's test accounts.

### Phase 1: Browse cabins (no auth) ~1–2 days
- [ ] Tabs layout (`(tabs)`: Cabins, Account) + stack for details
- [ ] Cabin list: `FlatList`, `expo-image`, price/discount, capacity, pull-to-refresh, loading/error states
- [ ] Capacity filter (all / 1–3 / 4–7 / 8–12, same as website)
- [ ] Cabin detail screen `cabins/[id].tsx`: image, description, capacity, price
- [ ] Josefin Sans font, app icon + splash from the website logo (`../vercel_the-wild-oasis-website/public/logo.png`)
- [ ] Optional: TanStack Query for fetching/caching (good talking point)

### Phase 2: Security / RLS ✅ done
SQL lives in `docs/sql/`, run by hand in Supabase → SQL Editor (no migrations tooling).
- [x] **2a: `01-rls-admins-and-guests.sql`** applied 2026-10-22, verified with
      `01-rls-check.sql` (impersonates each caller, rolls back):

      | caller | cabins | settings | bookings | guests | cabins updated |
      |---|---|---|---|---|---|
      | anon | 8 | 1 | 0 | 0 | (no privilege) |
      | signed in, not admin | 8 | 1 | 0 | 0 | 0 |
      | guest with bookings | 8 | 1 | 1 (own) | 1 (own) | 0 |
      | admin | 8 | 1 | 41 | 32 | 8 |

      Also via the REST API with the anon key: 8 cabins, 1 settings row, 0 bookings, 0 guests;
      `PATCH cabins` → `42501 permission denied`. Covers:
  - Admins = `app_metadata.role = 'admin'` (only settable server-side; `user_metadata` is
    user-editable). Only `dave@mail.com` is admin; `ozzy@mail.com` becomes a plain user.
    `public.is_admin()` reads the claim. Admins: all on the 4 tables and both buckets.
  - Drops all the course's "Enable … for all users" policies (tables + storage).
  - `cabins`, `settings`: select for `anon, authenticated`.
  - `guests`: select/insert/update own row only (`lower(email) = lower(auth.jwt()->>'email')`).
  - `bookings`: guests select own; delete own only if `startDate > now()`. No direct
    insert/update for guests (would let them set prices/status): RPCs in 2b.
  - Revokes anon writes and TRUNCATE (bypasses RLS) as defense in depth.
- [x] After 2a: owner logged in to the admin app as `dave@mail.com` (2026-10-22); all pages load
      with data. Writes not clicked through yet, but `01-rls-check.sql` shows the admin can
      update all cabins. Untested: storage uploads (cabin image, avatar) under the new bucket policy.
- [x] **2b: `02-booking-rpcs.sql`** applied 2026-10-22, verified with `02-booking-rpcs-check.sql`
      (10 cases, rolls back; all as expected). App calls: `supabase.rpc('<name>', { p_… })`.
  - `get_booked_dates(p_cabin_id)` → `[{ start_date, end_date }]`, anon + authenticated, no guest
    data. Same rule as the website (upcoming + checked-in).
  - `create_booking(p_cabin_id, p_start_date, p_end_date, p_num_guests, p_observations)` → new
    booking id. Authenticated only. Finds the guest by JWT email ("No guest profile for this
    account" if none), checks start > today, nights within `settings` min/max, guests ≤
    min(cabin capacity, `maxGuestsPerBooking`), observations ≤ 1000 chars, no overlap
    (check-out day is free; per-cabin advisory lock against double booking). Prices computed
    **server-side**, `status='unconfirmed'`, `isPaid=false`. (The website trusts client-sent
    prices; the app doesn't. Good point to show.)
  - `update_booking(p_booking_id, p_num_guests, p_observations)`: own, upcoming, unconfirmed
    only; same guest/observation limits. Someone else's booking → "Booking not found".
  - Cancel = plain `delete` on `bookings` (policy from 2a: own + future).
  - Errors are `raise exception` messages, meant to be shown to the user as-is.
  - Via the REST API with the anon key: `get_booked_dates` returns ranges; `create_booking`
    → `42501 permission denied for function`.
- Before Phase 3: turn "Allow new users to sign up" back on (needed for new Google users).

### Phase 3: Google sign-in ~1–2 days
- Recommended: **browser OAuth flow**, `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } })`
  + `expo-web-browser` `openAuthSessionAsync` + `expo-linking` to get back, then
  `exchangeCodeForSession`. Works in Expo Go. Docs: Supabase "native mobile deep linking" +
  "Login with Google (React Native)". Fetch them, don't code from memory.
- Native Google Sign-In (`@react-native-google-signin/google-signin` + `signInWithIdToken`)
  is nicer but needs a development build and iOS/Android client IDs. Optional upgrade later.
- Setup:
  - Supabase → Auth → Providers → Google: enable, enter a **Web** OAuth client ID + secret.
  - Google Cloud: add redirect URI `https://umjziqypywdmvwglyegr.supabase.co/auth/v1/callback`.
    ⚠️ The user doesn't remember which Google account owns the website's OAuth client
    (project number `609615697019`; open `console.cloud.google.com/apis/credentials?project=609615697019`
    in each account). Fallback: create a new OAuth client in any Google Cloud project (free).
  - Supabase → Auth → URL Configuration: add the app's redirect URLs (Expo Go `exp://…`, app
    scheme `thewildoasismobile://…`).
- On first sign-in, create the `guests` row (email, fullName) if missing (same as the website's `signIn` callback).
- Session persisted via `expo-sqlite` localStorage (already configured).

### Phase 4: Reservations ~1–2 days
- [ ] Account tab: profile (nationality picker + national ID, same validation as website: `^[a-zA-Z0-9]{6,12}$`)
- [ ] My reservations: list (cabin name/image, dates, nights, guests, price, status), past vs upcoming
- [ ] Cancel (only future, own bookings), with optimistic update
- [ ] Book from cabin detail: date-range picker with booked dates disabled, guest count
      (≤ maxCapacity), observations → `create_booking` RPC → thank-you screen
      (pick a date-range calendar lib that works in Expo Go; check docs/compatibility first)
- [ ] Edit booking (guests, observations)

### Phase 5: Polish & demo ~1 day
- [ ] Empty/error/loading states, haptics on actions, pull-to-refresh everywhere
- [ ] EAS: `npx eas-cli@latest login` (user needs an Expo account), `eas init`, `eas.json` with a
      `preview` profile `{"android": {"buildType": "apk"}}`, set `EXPO_PUBLIC_*` via `eas env:create`
- [ ] `npx eas-cli@latest build -p android --profile preview` → shareable APK link
- [ ] README for employers: screenshots/GIF, architecture diagram (app ↔ Supabase ↔ website),
      RLS/security section, tech choices, how to run, APK link
- [ ] 1–2 min screen recording (browse → sign in → book → cancel)
- [x] Public GitHub repo: https://github.com/deividas-butkus/the-wild-oasis-mobile (created 2026-10-22; keep pushing)

---

## Working conventions
- Install packages with `npx expo install` (SDK-compatible versions), not `npm install`.
- Before using any Expo/RN API, check the SDK 58 docs (see AGENTS.md).
- Done = `npm run typecheck` + `npm run lint` pass, and the app checked running (web or Expo Go).
- Commits: small, meaningful, **no Co-Authored-By / AI attribution lines**.
- Never commit `.env.local`; never use the service_role key in this app.
- `example/` holds the template's demo code for reference only (gitignored); delete when not needed.
