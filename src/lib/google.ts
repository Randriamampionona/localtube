import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Retrieve the signed-in user's Google OAuth access token from Clerk, but only
 * if it actually carries the youtube.readonly scope. Returns null otherwise so
 * callers fall back to public (API-key) data.
 *
 * Server-only. Clerk mints a fresh token on each call (it does not refresh
 * proactively). The youtube.readonly scope must be enabled on the Google
 * connection in the Clerk Dashboard — it can't be configured from code.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const client = await clerkClient();
    // "google" is current; older Clerk used the deprecated "oauth_google".
    const res = await client.users.getUserOauthAccessToken(userId, "google");
    const entry = res.data?.[0];
    if (!entry?.token) return null;

    const scopes = entry.scopes ?? [];
    const hasYouTube = scopes.some((s) => s.includes("youtube"));
    return hasYouTube ? entry.token : null;
  } catch {
    return null;
  }
}
