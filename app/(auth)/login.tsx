import { Redirect } from "expo-router";

/**
 * Redirects to sign-in for consistency with auth links that may point to /login.
 */
export default function LoginScreen() {
  return <Redirect href="/(auth)/sign-in" />;
}
