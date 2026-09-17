"use server";

import {
  getComments,
  getPlaylistItemsPage,
  getRelatedPage,
  getSubscriptionsFeed,
  getTrendingPage,
  searchPage,
} from "@/lib/youtube";
import { getGoogleAccessToken } from "@/lib/google";
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

/**
 * Home feed loader. For the "all" tab, a signed-in user who granted the
 * youtube.readonly scope gets their subscriptions feed; everyone else (and
 * every other category) falls back to the trending chart.
 */
export async function loadHome(
  category: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  if (category === "all") {
    const token = await getGoogleAccessToken();
    if (token) {
      try {
        const page = await getSubscriptionsFeed(token, pageToken);
        if (page.items.length) return page;
      } catch {
        /* scope revoked / quota / transient — fall back to trending */
      }
    }
  }
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
