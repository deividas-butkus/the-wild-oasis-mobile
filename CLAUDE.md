@AGENTS.md

# Project: The Wild Oasis Mobile

Guest-facing Expo app for The Wild Oasis cabin hotel, sharing the Supabase database with the
website in `../vercel_the-wild-oasis-website`. It's a demo/portfolio project to show an employer
hands-on mobile work. Not for store release.

**Read `docs/PLAN.md` first.** It has the decisions, database schema, phases with checkboxes,
security (RLS) plan and auth approach. Tick off items there as they're completed and keep its
"Phase" statuses current.

## Must-knows
- Run `nvm use` first (Node 24 from `.nvmrc`; Expo SDK 58 needs Node ≥ 22.13; the system default is 22.5.1).
- Supabase key in this app = **publishable/anon only** (`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
  `.env.local`). Never the service_role/secret key: it would ship inside the app.
- Do Phase 2 (RLS) before building auth/booking features. Check the admin app
  (`../vercel_the-wild-oasis`) before changing policies, since it shares the database.
- No Xcode or Android SDK on this machine: verify with `npm run web` and Expo Go on the user's phone.
- Git: small meaningful commits, **no Co-Authored-By or other AI attribution lines**. Ask before pushing.
