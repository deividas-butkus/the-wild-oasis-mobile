import { createClient } from "@supabase/supabase-js";

// Web variant: the browser's own localStorage is used, so no expo-sqlite polyfill.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey)
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example)");

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: typeof window !== "undefined",
    detectSessionInUrl: false,
    // OAuth returns a one-time code (exchanged in src/lib/auth.tsx), not tokens in the URL
    flowType: "pkce",
  },
});
