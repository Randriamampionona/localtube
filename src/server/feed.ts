"use server";

import {
  getComments,
  getPlaylistItemsPage,
  getRelatedPage,
  getTrendingPage,
  searchPage,
} from "@/lib/youtube";
import type {
  ChannelResult,
  Comment,
  Page,
  PlaylistSummary,
  SearchType,
  VideoSummary,
} from "@/types/youtube";

/**
 * Server actions = the client bridge for infinite scroll. Client feed
 * components import these and call them for pages 2..n; the API key never
 * leaves the server. Every arg is a plain string so the call is serializable.
 */

export async function loadTrending(
  category: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  return getTrendingPage(category, pageToken);
}

export async function loadSearch(
  query: string,
  type: SearchType,
  pageToken?: string,
): Promise<Page<VideoSummary | ChannelResult | PlaylistSummary>> {
  return searchPage(query, type, pageToken);
}

export async function loadRelated(
  seed: string,
  excludeId: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  return getRelatedPage(seed, excludeId, pageToken);
}

export async function loadComments(
  videoId: string,
  pageToken?: string,
): Promise<Page<Comment>> {
  return getComments(videoId, pageToken);
}

export async function loadPlaylistItems(
  playlistId: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  return getPlaylistItemsPage(playlistId, pageToken);
}
