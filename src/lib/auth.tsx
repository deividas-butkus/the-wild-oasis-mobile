import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Google sign-in through Supabase Auth, using the browser OAuth flow (works in Expo Go):
// Supabase hands back a sign-in URL, we open it in an auth session, Google redirects to
// Supabase, which redirects to `redirectTo` with a one-time code that we exchange (PKCE).
// redirectTo must be allowed in Supabase → Auth → URL Configuration (see docs/PLAN.md).

type AuthState = { session: Session | null; isLoading: boolean };

const AuthContext = createContext<AuthState>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true });

  useEffect(() => {
    // Fires INITIAL_SESSION right away (from storage), then on every sign-in/out/refresh
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ session, isLoading: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  return use(AuthContext);
}

// Supabase Auth rejects redirect URLs whose host is an IP address (other than loopback),
// whatever the allow-list says, so Expo Go's LAN URL (exp://192.168.x.x:8081/--/...) never
// passes. On iOS the auth session catches the app scheme itself, even in Expo Go, so use it
// there. Elsewhere use the platform's URL: web http://localhost:8081/..., Android builds the
// app scheme; Android in Expo Go needs `npx expo start --tunnel` (a hostname, not an IP).
function authRedirectUrl() {
  return Platform.OS === "ios"
    ? "thewildoasismobile://auth/callback"
    : Linking.createURL("auth/callback");
}

// Resolves false if the user closed the browser without signing in
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = authRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error("Google sign-in could not be started");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (typeof code !== "string") {
    const reason = queryParams?.error_description;
    throw new Error(typeof reason === "string" ? reason : "Google sign-in failed");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error("Google sign-in failed");
  return true;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Sign out failed");
}
