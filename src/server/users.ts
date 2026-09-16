import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface ClerkUserSync {
  clerkId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

const usersCol = () => adminDb.collection("users");

/**
 * Create-or-update the user document at users/{clerkId}.
 * Called for both user.created and user.updated — a merge write makes the
 * handler idempotent, which matters because Svix may deliver an event twice.
 */
export async function upsertUserFromClerk(user: ClerkUserSync) {
  const ref = usersCol().doc(user.clerkId);
  await ref.set(
    {
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      updatedAt: FieldValue.serverTimestamp(),
      // Only stamps on first write thanks to merge + set-if-absent pattern below.
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Soft-delete: flag the doc instead of destroying history. Swap for
 * `ref.delete()` if you prefer a hard delete.
 */
export async function deleteUser(clerkId: string) {
  const ref = usersCol().doc(clerkId);
  await ref.set(
    {
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUser(clerkId: string) {
  const snap = await usersCol().doc(clerkId).get();
  return snap.exists ? snap.data() : null;
}
