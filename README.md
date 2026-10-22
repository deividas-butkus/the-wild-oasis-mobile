# The Wild Oasis — Mobile

Guest-facing mobile app for **The Wild Oasis**, a boutique cabin hotel. Built with **Expo (React
Native) + TypeScript**, on the same **Supabase** backend as the
[website](https://the-wild-oasis-website-udemy.vercel.app).

> Work in progress — see [docs/PLAN.md](docs/PLAN.md) for the roadmap.

## Planned features
- Browse cabins, filter by capacity, view details
- Google sign-in (Supabase Auth)
- Book a cabin with availability calendar; view, edit and cancel reservations
- Data protected by Postgres Row Level Security — the app only holds the public (anon) key

## Run locally
```bash
nvm use                  # Node 24 (see .nvmrc)
npm install
cp .env.example .env.local   # then fill in the Supabase URL + publishable key
npx expo start           # scan the QR code with Expo Go, or press w for web
```

## Tech
Expo SDK 58 · Expo Router · React Native 0.88 · TypeScript · Supabase (`@supabase/supabase-js`, session in `expo-sqlite`)
