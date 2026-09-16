import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Routes that require a signed-in user. Everything else (home, watch, search,
 * channel pages, and the webhook endpoint) stays public.
 */
const isProtectedRoute = createRouteMatcher([
  "/library(.*)",
  "/playlists(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Redirects unauthenticated users to the Clerk sign-in flow.
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (including the Clerk webhook).
    "/(api|trpc)(.*)",
  ],
};
