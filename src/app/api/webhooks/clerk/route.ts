import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import {
  deleteUser,
  upsertUserFromClerk,
} from "@/server/users";

/**
 * Clerk → Svix → Next.js → Firebase
 *
 * Clerk signs every webhook with Svix. We verify the three Svix headers
 * against the raw request body using our signing secret before trusting a
 * single byte of the payload. An unverified body is rejected with 400.
 *
 * Configure the endpoint URL in the Clerk Dashboard:
 *   Webhooks → Add Endpoint → https://<your-domain>/api/webhooks/clerk
 * and subscribe to user.created, user.updated, user.deleted.
 */
export async function POST(req: Request) {
  const secret = process.env.SVIX_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] SVIX_SECRET is not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  // 1. Pull the Svix signature headers.
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  // 2. Verify the RAW body — do not JSON.parse before verifying.
  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // 3. Route the verified event to Firestore.
  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } =
          evt.data;

        const primaryEmail =
          email_addresses?.find(
            (e) => e.id === evt.data.primary_email_address_id,
          )?.email_address ?? email_addresses?.[0]?.email_address ?? null;

        await upsertUserFromClerk({
          clerkId: id,
          email: primaryEmail,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatar: image_url ?? null,
        });
        break;
      }

      case "user.deleted": {
        // evt.data.id can be undefined for already-purged users.
        if (evt.data.id) await deleteUser(evt.data.id);
        break;
      }

      default:
        // Ignore event types we don't sync (session.*, etc.).
        break;
    }
  } catch (err) {
    console.error(`[clerk-webhook] failed handling ${evt.type}`, err);
    // 500 tells Clerk/Svix to retry with backoff.
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
