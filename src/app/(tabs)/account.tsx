import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { ErrorState, Loading } from "@/components/screen-state";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { signInWithGoogle, signOut, useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";

export default function AccountScreen() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  return session ? <SignedIn user={session.user} /> : <SignedOut />;
}

function SignedOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.text}>Sign in to manage your profile and cabin reservations.</Text>
      <Button label="Continue with Google" onPress={handleSignIn} busy={busy} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function SignedIn({ user }: { user: User }) {
  const { data: guest, error, isPending, refetch } = useGuest(user);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  if (isPending) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const firstName = guest.fullName.split(" ")[0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {firstName}</Text>
      <Text style={styles.text}>{guest.email}</Text>
      <Text style={styles.text}>Your profile and reservations are coming soon.</Text>
      <Button label="Sign out" variant="secondary" onPress={handleSignOut} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.accent[400],
  },
  text: {
    color: colors.primary[200],
    textAlign: "center",
  },
  error: {
    color: colors.accent[300],
    textAlign: "center",
  },
});
