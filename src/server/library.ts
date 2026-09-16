"use server";

import { auth } from "@clerk/nextjs/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

export interface SavedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/* ----------------------------- Favorites ----------------------------- */
// Stored at users/{clerkId}/favorites/{videoId}

export async function isFavorite(videoId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const snap = await adminDb
    .doc(`users/${userId}/favorites/${videoId}`)
    .get();
  return snap.exists;
}

export async function toggleFavorite(video: SavedVideo): Promise<boolean> {
  const userId = await requireUserId();
  const ref = adminDb.doc(`users/${userId}/favorites/${video.videoId}`);
  const snap = await ref.get();

  let nowFavorited: boolean;
  if (snap.exists) {
    await ref.delete();
    nowFavorited = false;
  } else {
    await ref.set({ ...video, savedAt: FieldValue.serverTimestamp() });
    nowFavorited = true;
  }

  revalidatePath("/library");
  return nowFavorited;
}

export async function listFavorites(): Promise<SavedVideo[]> {
  const userId = await requireUserId();
  const q = await adminDb
    .collection(`users/${userId}/favorites`)
    .orderBy("savedAt", "desc")
    .get();
  return q.docs.map((d) => d.data() as SavedVideo);
}

/* ----------------------------- Playlists ----------------------------- */
// users/{clerkId}/playlists/{playlistId} with an `items` array of SavedVideo.

export async function createPlaylist(title: string): Promise<string> {
  const userId = await requireUserId();
  const ref = adminDb.collection(`users/${userId}/playlists`).doc();
  await ref.set({
    id: ref.id,
    title,
    items: [],
    createdAt: FieldValue.serverTimestamp(),
  });
  revalidatePath("/playlists");
  return ref.id;
}

export async function addToPlaylist(playlistId: string, video: SavedVideo) {
  const userId = await requireUserId();
  await adminDb.doc(`users/${userId}/playlists/${playlistId}`).update({
    items: FieldValue.arrayUnion(video),
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath("/playlists");
}

export async function listPlaylists() {
  const userId = await requireUserId();
  const q = await adminDb
    .collection(`users/${userId}/playlists`)
    .orderBy("createdAt", "desc")
    .get();
  return q.docs.map((d) => d.data());
}
