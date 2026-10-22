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

### Phase 0: Setup ✅ partly done
- [x] Expo project (default template, reset), Supabase client (`src/lib/supabase.ts`, `.web.ts`)
- [x] Theme colors, dark app config, `.env.example`, `.nvmrc`, typecheck/lint passing
- [x] Legacy `anon` key in `.env.local` (2026-10-22). App runs on web and shows "Connected: 0 cabins visible"
- [x] RLS state as seen by the anon key: **all 4 tables return 0 rows, no error**. So RLS is
      enabled but no policy grants `anon` read access. Safe default; Phase 2 opens what's needed.
- [ ] Check the admin app (`../vercel_the-wild-oasis`): which key, which tables it writes. It
      likely uses the anon key + `authenticated` policies, so **read the existing policies**
      (Supabase → Database → Policies) before adding/changing any
- [ ] Inspect existing policies/grants in the SQL editor:
      `select tablename, policyname, roles, cmd, qual from pg_policies where schemaname='public';`

### Phase 1: Browse cabins (no auth) ~1–2 days
- [ ] Tabs layout (`(tabs)`: Cabins, Account) + stack for details
- [ ] Cabin list: `FlatList`, `expo-image`, price/discount, capacity, pull-to-refresh, loading/error states
- [ ] Capacity filter (all / 1–3 / 4–7 / 8–12, same as website)
- [ ] Cabin detail screen `cabins/[id].tsx`: image, description, capacity, price
- [ ] Josefin Sans font, app icon + splash from the website logo (`../vercel_the-wild-oasis-website/public/logo.png`)
- [ ] Optional: TanStack Query for fetching/caching (good talking point)

### Phase 2: Security / RLS ~½ day ⚠️ do before writing any auth/booking code
Draft policies (verify against Phase 0 findings; run in the SQL editor):
- `cabins`, `settings`: RLS on; `select` for `anon, authenticated` using `true`.
- `bookings`: **don't expose to anon** (contains guest data). For availability add a
  `security definer` RPC `get_booked_dates(cabin_id)` returning only `startDate, endDate`.
- `guests`: `authenticated` may select/update/insert only `where email = auth.jwt()->>'email'`.
- `bookings` for the guest: select/update/delete only rows whose `guestId` belongs to the
  caller's email.
- **Create booking via RPC** `create_booking(cabin_id, start_date, end_date, num_guests, observations)`:
  compute `numNights`, `cabinPrice`, `totalPrice` from `cabins` **server-side**, check overlaps and
  `settings` limits, force `status='unconfirmed'`, `isPaid=false`. (The website trusts
  client-sent prices; the app shouldn't. Good point to show.)
- Grants: policies need matching grants (`grant select on public.cabins to anon, authenticated`),
  otherwise error `42501`.
- Test: anon can read cabins but not bookings/guests; user A can't see user B's bookings.

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
