import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { CountryPicker, type Country } from "@/components/country-picker";
import { Field, Input } from "@/components/form";
import { ErrorState, Loading } from "@/components/screen-state";
import { Text } from "@/components/text";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import countries from "@/data/countries.json";
import { signInWithGoogle, signOut, useAuth } from "@/lib/auth";
import { useGuest, useUpdateGuest, type Guest } from "@/lib/guest";

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

  if (isPending) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  return <Profile guest={guest} />;
}

// Match by flag first: some saved names come from an older country list (as on the website)
function findCountry({ nationality, countryFlag }: Guest): Country | null {
  return (
    countries.find((c) => c.flag === countryFlag) ??
    countries.find((c) => c.name === nationality) ??
    null
  );
}

function Profile({ guest }: { guest: Guest }) {
  const [country, setCountry] = useState(() => findCountry(guest));
  const [nationalID, setNationalID] = useState(guest.nationalID ?? "");
  const [signingOut, setSigningOut] = useState(false);
  const update = useUpdateGuest(guest);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const firstName = guest.fullName.split(" ")[0];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome, {firstName}</Text>
        <Text style={styles.text}>
          Completing your profile makes check-in faster and smoother. See you soon!
        </Text>

        <Field label="Full name">
          <Input value={guest.fullName} editable={false} style={styles.readOnly} />
        </Field>
        <Field label="Email address">
          <Input value={guest.email} editable={false} style={styles.readOnly} />
        </Field>
        <Field label="Where are you from?">
          <CountryPicker value={country} onChange={setCountry} />
        </Field>
        <Field label="National ID number" hint="6–12 letters or digits">
          <Input
            value={nationalID}
            onChangeText={setNationalID}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
          />
        </Field>

        {update.error && <Text style={styles.error}>{update.error.message}</Text>}
        {update.isSuccess && <Text style={styles.success}>Profile updated.</Text>}

        <Button
          label="Update profile"
          busy={update.isPending}
          onPress={() =>
            update.mutate({
              nationality: country?.name ?? "",
              countryFlag: country?.flag ?? "",
              nationalID,
            })
          }
        />
        <Button label="Sign out" variant="secondary" onPress={handleSignOut} busy={signingOut} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 20,
    gap: 20,
  },
  readOnly: {
    color: colors.primary[400],
  },
  success: {
    color: colors.accent[400],
    textAlign: "center",
  },
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
