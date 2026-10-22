import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Where Google sign-in redirects back to (src/lib/auth.tsx exchanges the code).
// Web: this page loads in the sign-in popup; hand the URL to the opener and close.
// Native: the auth session normally catches the redirect, but if it also arrives as a
// deep link (Android), Expo Router lands here, so just go to the Account tab.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  return <Redirect href="/account" />;
}
