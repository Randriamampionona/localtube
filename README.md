# LocalTube

A modern YouTube-style client built on the App Router. Public feeds, search,
watch and channel pages powered by the **YouTube Data API v3**, plus
**Clerk** auth (Google OAuth), a **Svix**-verified webhook that syncs users to
**Firestore**, and per-user favorites and playlists. Custom "quiet slate /
electric violet" design system with light + dark themes.

## Tech stack

| Layer          | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 15 (App Router, TypeScript, RSC)          |
| Styling        | Tailwind CSS + shadcn/ui, `next-themes`           |
| Auth           | Clerk (Google OAuth SSO)                          |
| Data / storage | Firebase — Firestore (Admin SDK server-side)      |
| Webhook sync   | Svix signature verification of Clerk events       |
| Video data     | YouTube Data API v3                               |

---

## Directory structure

```
localtube/
├── middleware.ts                     # Clerk route protection (library, playlists)
├── firestore.rules                   # per-user data lockdown for direct client access
├── .env.example                      # every required variable, documented
├── components.json                   # shadcn config
├── tailwind.config.ts  next.config.mjs  postcss.config.mjs
└── src/
    ├── app/
    │   ├── layout.tsx                # Clerk + theme providers, sticky header, sidebar
    │   ├── globals.css               # LocalTube design tokens (light/dark)
    │   ├── page.tsx                  # Home — category bar + streamed trending grid
    │   ├── watch/
    │   │   ├── page.tsx              # player, details, favorite CTA, related rail
    │   │   └── description-toggle.tsx
    │   ├── search/page.tsx           # list-view search results
    │   ├── channel/[channelId]/page.tsx   # banner, stats, Videos/Playlists/About tabs
    │   ├── library/page.tsx          # saved favorites (protected)
    │   ├── playlists/page.tsx        # custom playlists (protected)
    │   ├── sign-in/[[...sign-in]]/page.tsx
    │   ├── sign-up/[[...sign-up]]/page.tsx
    │   └── api/webhooks/clerk/route.ts    # Svix-verified Clerk → Firestore sync
    ├── components/
    │   ├── site-header.tsx  category-bar.tsx  theme-toggle.tsx
    │   ├── video-card.tsx  video-grid.tsx  video-skeleton.tsx
    │   ├── providers/theme-provider.tsx
    │   ├── watch/video-player.tsx  watch/favorite-button.tsx
    │   └── ui/button.tsx  ui/skeleton.tsx
    ├── lib/
    │   ├── youtube.ts                # trending / search / video / channel / related
    │   ├── firebase/admin.ts         # lazy server-only Admin SDK singleton
    │   ├── firebase/client.ts        # browser SDK (optional client reads)
    │   ├── format.ts                 # counts, relative time, ISO 8601 duration
    │   └── utils.ts                  # cn()
    ├── server/
    │   ├── users.ts                  # Firestore user upsert / delete (webhook)
    │   └── library.ts                # favorites + playlists server actions
    └── types/youtube.ts
```

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3000
```

`npm run build` produces an optimized production build; `npm run typecheck`
runs `tsc --noEmit`.

---

## Environment variables

All variables live in `.env.example`. Where to get each one:

### Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
1. Create an application in the Clerk Dashboard.
2. **User & Authentication → Social Connections → enable Google.**
3. Copy the keys from **API Keys**.
4. (Optional) To read a user's own subscriptions/history, add the
   `https://www.googleapis.com/auth/youtube.readonly` scope to the Google
   connection's **Scopes**. Clerk then stores the Google OAuth token, which you
   can retrieve server-side with `clerkClient.users.getUserOauthAccessToken()`.

### Svix / webhook (`SVIX_SECRET`)
1. **Clerk Dashboard → Webhooks → Add Endpoint.**
2. URL: `https://<your-domain>/api/webhooks/clerk`
   (use an ngrok/tunnel URL while developing locally).
3. Subscribe to `user.created`, `user.updated`, `user.deleted`.
4. Copy the **Signing Secret** (`whsec_…`) into `SVIX_SECRET`.

### Firebase — client (`NEXT_PUBLIC_FIREBASE_*`)
**Firebase Console → Project settings → General → Your apps (Web).**

### Firebase — Admin (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
**Project settings → Service accounts → Generate new private key.** Paste the
private key on one line with the literal `\n` escapes intact, wrapped in quotes
(the app converts them back to newlines at runtime).

### YouTube (`YOUTUBE_API_KEY`)
**Google Cloud Console → APIs & Services.** Enable **YouTube Data API v3**,
then create an API key under **Credentials**.

---

## How the pieces fit together

### Auth + webhook sync — `Clerk ➔ Svix ➔ Next.js ➔ Firebase`
`src/app/api/webhooks/clerk/route.ts` verifies the raw request body against the
three Svix headers **before** parsing anything, then routes the event:

- `user.created` / `user.updated` → `upsertUserFromClerk()` writes
  `users/{clerkId}` with a `{ merge: true }` set, so duplicate deliveries are
  idempotent.
- `user.deleted` → `deleteUser()` soft-flags the document.

A bad signature returns `400`; a handler failure returns `500` so Svix retries
with backoff.

### Data access
Firestore writes run **server-side** — the webhook and the server actions in
`src/server/library.ts` (`toggleFavorite`, `addToPlaylist`, …) use the Admin
SDK gated behind Clerk `auth()`. `firestore.rules` denies direct client writes
to match. The Admin SDK is lazily initialized, so importing a route that
touches it never requires live credentials at build time.

### YouTube quota
The free quota is **10,000 units/day** and a single `search.list` call costs
**100 units**. The service caches responses with Next's `revalidate` windows
(30 min for trending, 10 min for search) and hydrates search hits with one
`videos.list` call rather than N. Category feeds and "Up next" use search
because `mostPopular` only takes a chart and `relatedToVideoId` is deprecated.

### Theme
`next-themes` with `attribute="class"`, system detection, and a mount-guarded
toggle to avoid hydration mismatch. Tokens live as CSS variables in
`globals.css`; violet drives every CTA, emerald is reserved for live/new
signals only.

---

## shadcn/ui components

`button` and `skeleton` are included so the project builds as-is. Add more with:

```bash
npx shadcn@latest add avatar dropdown-menu dialog tabs
```

`components.json` is already configured (new-york style, slate base, CSS
variables, `@/components/ui`).

---

## What's scaffolded vs. production-ready

Ready: auth, the verified webhook, user sync, favorites, YouTube feeds/search,
watch + channel pages, theming, quota-aware caching.

Left as clearly-marked extension points:
- **Add to playlist** UI (the `createPlaylist` / `addToPlaylist` actions exist;
  wire a dialog on the watch page).
- **Channel → Playlists tab** (call `playlists.list` the same way
  `getChannelVideos` calls `search.list`).
- **Personalized feeds** from the user's Google token (subscriptions/history).
- **Clerk ↔ Firebase Auth** custom-token bridge if you want direct client reads
  under the security rules.

---

## Note on third-party APIs

Clerk and Svix ship breaking changes periodically. The patterns here
(`clerkMiddleware` + `createRouteMatcher`, `svix` `Webhook.verify`) are the
current stable ones, but confirm the middleware and webhook-secret naming
against the live Clerk docs before deploying.
