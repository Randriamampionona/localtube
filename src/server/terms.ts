"use server";

import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { encodeQuery } from "@/lib/crypto";

export interface FollowedTerm {
  id: string;
  term: string;
  encodedHash: string;
}

/** Stable, filesystem-safe doc id derived from the term. */
function slugify(term: string): string {
  return (
    term
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "term"
  );
}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** users/{clerkId}/followed_terms/{termId} */
function termsCol(userId: string) {
  return adminDb.collection(`users/${userId}/followed_terms`);
}

export async function isTermFollowed(term: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId || !term.trim()) return false;
  const snap = await termsCol(userId).doc(slugify(term)).get();
  return snap.exists;
}

/** Follow if not followed, unfollow if it is. Returns the new followed state. */
export async function toggleFollowTerm(term: string): Promise<boolean> {
  const userId = await requireUserId();
  const clean = term.trim();
  if (!clean) return false;

  const id = slugify(clean);
  const ref = termsCol(userId).doc(id);
  const snap = await ref.get();

  let nowFollowed: boolean;
  if (snap.exists) {
    await ref.delete();
    nowFollowed = false;
  } else {
    await ref.set({
      id,
      term: clean,
      encodedHash: encodeQuery(clean),
      createdAt: FieldValue.serverTimestamp(),
    });
    nowFollowed = true;
  }

  // Refresh the home category bar, which reads the followed terms.
  revalidatePath("/");
  return nowFollowed;
}

export async function listFollowedTerms(): Promise<FollowedTerm[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const q = await termsCol(userId).orderBy("createdAt", "desc").get();
  return q.docs.map((d) => {
    const x = d.data();
    return { id: x.id, term: x.term, encodedHash: x.encodedHash };
  });
}
