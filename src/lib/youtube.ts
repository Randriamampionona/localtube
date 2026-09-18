import "server-only";
import type {
  ChannelResult,
  ChannelSummary,
  Comment,
  Page,
  PlaylistSummary,
  SearchType,
  VideoDetail,
  VideoSummary,
} from "@/types/youtube";

const BASE = "https://www.googleapis.com/youtube/v3";

/* ----------------------------- Key rotation ----------------------------- */

function allKeys(): string[] {
  const keys = [
    process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY_V1,
    process.env.YOUTUBE_API_KEY_V2,
    process.env.YOUTUBE_API_KEY_V3,
    process.env.YOUTUBE_API_KEY_V4,
    process.env.YOUTUBE_API_KEY_V5,
    process.env.YOUTUBE_API_KEY_V6,
    process.env.YOUTUBE_API_KEY_V7,
    process.env.YOUTUBE_API_KEY_V8,
    process.env.YOUTUBE_API_KEY_V9,
    process.env.YOUTUBE_API_KEY_V10,
  ].filter((k): k is string => Boolean(k));
  if (keys.length === 0) throw new Error("No YOUTUBE_API_KEY configured");
  return keys;
}

const QUOTA_REASON = /quotaExceeded|dailyLimitExceeded|rateLimitExceeded|userRateLimitExceeded/;

/** True when a failed response means "this key is spent" and we should rotate. */
function isQuotaError(status: number, body: string): boolean {
  // Quota errors arrive as 429, OR as 403 with a quota reason in the body.
  return status === 429 || (status === 403 && QUOTA_REASON.test(body));
}

/** Thrown for a non-quota 4xx (e.g. commentsDisabled) so callers can catch it. */
class YouTubeApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function yt<T>(
  path: string,
  params: Record<string, string>,
  revalidate = 60 * 30,
): Promise<T> {
  const keys = allKeys();
  let lastErr: unknown;

  for (const key of keys) {
    const url = new URL(`${BASE}/${path}`);
    Object.entries({ ...params, key }).forEach(([k, v]) =>
      url.searchParams.set(k, v),
    );

    const res = await fetch(url, { next: { revalidate } });
    if (res.ok) return res.json() as Promise<T>;

    const detail = await res.text().catch(() => "");
    // Quota (403 quotaExceeded OR 429) → this key is done, try the next one.
    // Any other error (commentsDisabled, 400, 404) is identical on every key.
    if (isQuotaError(res.status, detail)) {
      lastErr = new YouTubeApiError(res.status, `key exhausted on ${path}`);
      continue;
    }
    throw new YouTubeApiError(
      res.status,
      `YouTube ${res.status} on ${path}: ${detail.slice(0, 200)}`,
    );
  }
  // Every key was quota-exhausted.
  throw lastErr ?? new Error("All YouTube API keys exhausted");
}

/* ----------------------------- Mappers ----------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapVideoItem(item: any): VideoDetail {
  const s = item.snippet ?? {};
  const stats = item.statistics ?? {};
  return {
    id: typeof item.id === "string" ? item.id : item.id?.videoId,
    title: s.title ?? "",
    description: s.description ?? "",
    thumbnail: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? "",
    channelId: s.channelId ?? "",
    channelTitle: s.channelTitle ?? "",
    publishedAt: s.publishedAt ?? "",
    viewCount: stats.viewCount ? Number(stats.viewCount) : undefined,
    likeCount: stats.likeCount ? Number(stats.likeCount) : undefined,
    duration: item.contentDetails?.duration,
    tags: s.tags,
  };
}

function mapChannelResult(item: any): ChannelResult {
  const s = item.snippet ?? {};
  return {
    id: item.id?.channelId ?? item.snippet?.channelId ?? item.id,
    title: s.title ?? s.channelTitle ?? "",
    description: s.description ?? "",
    avatar: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? "",
  };
}

function mapPlaylistResult(item: any): PlaylistSummary {
  const s = item.snippet ?? {};
  return {
    id: item.id?.playlistId ?? item.id,
    title: s.title ?? "",
    description: s.description ?? "",
    thumbnail: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? "",
    channelId: s.channelId ?? "",
    channelTitle: s.channelTitle ?? "",
    itemCount: item.contentDetails?.itemCount,
  };
}

function mapComment(item: any): Comment {
  const c = item.snippet?.topLevelComment?.snippet ?? {};
  return {
    id: item.id,
    author: c.authorDisplayName ?? "",
    avatar: c.authorProfileImageUrl ?? "",
    text: c.textDisplay ?? "",
    likeCount: Number(c.likeCount ?? 0),
    publishedAt: c.publishedAt ?? "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* --------------------- Channel avatar batching --------------------- */

/**
 * videos.list / search.list don't return the channel's avatar, so we batch a
 * single channels.list call for every unique channelId and stamp the avatar
 * onto each video. One extra unit per feed page — cheap.
 */
async function hydrateAvatars<T extends VideoSummary>(videos: T[]): Promise<T[]> {
  const ids = [...new Set(videos.map((v) => v.channelId).filter(Boolean))];
  if (ids.length === 0) return videos;

  const data = await yt<{ items: any[] }>("channels", {
    part: "snippet",
    id: ids.slice(0, 50).join(","), // 50 = max ids per call
    maxResults: "50",
  });
  const avatarById = new Map<string, string>();
  for (const c of data.items ?? []) {
    avatarById.set(
      c.id,
      c.snippet?.thumbnails?.default?.url ?? c.snippet?.thumbnails?.medium?.url ?? "",
    );
  }
  return videos.map((v) => ({ ...v, channelAvatar: avatarById.get(v.channelId) }));
}

/** Take search.list video results → hydrate stats/duration + avatars. */
async function hydrateVideoIds(
  ids: string[],
  nextPageToken?: string,
): Promise<Page<VideoSummary>> {
  if (ids.length === 0) return { items: [], nextPageToken };
  const details = await yt<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.slice(0, 50).join(","), // videos.list caps at 50 ids
  });
  const items = await hydrateAvatars(details.items.map(mapVideoItem));
  return { items, nextPageToken };
}

/* ----------------------------- Feeds ----------------------------- */

const CATEGORY_QUERY: Record<string, string> = {
  music: "music",
  gaming: "gaming",
  tech: "technology",
  news: "news today",
  sports: "sports highlights",
  movies: "movie trailer",
};

/** Trending feed (paginated). `all` uses the mostPopular chart. */
export async function getTrendingPage(
  category = "all",
  pageToken?: string,
  regionCode = "US",
): Promise<Page<VideoSummary>> {
  if (category === "all") {
    const data = await yt<{ items: any[]; nextPageToken?: string }>(
      "videos",
      {
        part: "snippet,statistics,contentDetails",
        chart: "mostPopular",
        maxResults: "50",
        regionCode,
        ...(pageToken ? { pageToken } : {}),
      },
      60 * 60, // trending changes slowly — cache 1h (0 quota on cache hits)
    );
    const items = await hydrateAvatars(data.items.map(mapVideoItem));
    return { items, nextPageToken: data.nextPageToken };
  }
  return searchVideosPage(CATEGORY_QUERY[category] ?? category, pageToken);
}

/* ----------------------------- Search ----------------------------- */

async function searchList(
  query: string,
  type: "video" | "channel" | "playlist",
  pageToken?: string,
  extra: Record<string, string> = {},
) {
  return yt<{ items: any[]; nextPageToken?: string }>(
    "search",
    {
      part: "snippet",
      q: query,
      type,
      maxResults: "50", // API maximum — fullest result set per request
      safeSearch: "none", // no SafeSearch filtering (valid for every type)
      ...(pageToken ? { pageToken } : {}),
      ...extra,
    },
    // search costs 100 quota units — cache hard (1h). A cache hit is free.
    60 * 60,
  );
}

export async function searchVideosPage(
  query: string,
  pageToken?: string,
  live = false,
): Promise<Page<VideoSummary>> {
  // videoSyndicated / eventType are video-only filters — safe here (type=video).
  const search = await searchList(query, "video", pageToken, {
    videoSyndicated: "any",
    ...(live ? { eventType: "live" } : {}),
  });
  const ids = search.items.map((i) => i.id?.videoId).filter(Boolean);
  return hydrateVideoIds(ids, search.nextPageToken);
}

export async function searchChannelsPage(
  query: string,
  pageToken?: string,
): Promise<Page<ChannelResult>> {
  const search = await searchList(query, "channel", pageToken);
  return {
    items: search.items.map(mapChannelResult),
    nextPageToken: search.nextPageToken,
  };
}

export async function searchPlaylistsPage(
  query: string,
  pageToken?: string,
): Promise<Page<PlaylistSummary>> {
  const search = await searchList(query, "playlist", pageToken);
  return {
    items: search.items.map(mapPlaylistResult),
    nextPageToken: search.nextPageToken,
  };
}

/** Dispatcher used by the /search route and its infinite loader. */
export async function searchPage(
  query: string,
  type: SearchType,
  pageToken?: string,
): Promise<Page<VideoSummary | ChannelResult | PlaylistSummary>> {
  switch (type) {
    case "channel":
      return searchChannelsPage(query, pageToken);
    case "playlist":
      return searchPlaylistsPage(query, pageToken);
    case "live":
      return searchVideosPage(query, pageToken, true);
    case "video":
    default:
      return searchVideosPage(query, pageToken);
  }
}

/* ----------------------------- Watch ----------------------------- */

export async function getVideo(id: string): Promise<VideoDetail | null> {
  const data = await yt<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id,
  });
  if (!data.items[0]) return null;
  const detail = mapVideoItem(data.items[0]);
  const [hydrated] = await hydrateAvatars([detail]);
  return { ...detail, channelAvatar: hydrated.channelAvatar };
}

/** Related sidebar (paginated) — approximated via search since
 *  relatedToVideoId is deprecated. Pass a serializable seed + id to exclude. */
export async function getRelatedPage(
  seed: string,
  excludeId: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  const page = await searchVideosPage(seed, pageToken);
  return {
    items: page.items.filter((v) => v.id !== excludeId),
    nextPageToken: page.nextPageToken,
  };
}

export async function getComments(
  videoId: string,
  pageToken?: string,
): Promise<Page<Comment>> {
  try {
    const data = await yt<{ items: any[]; nextPageToken?: string }>(
      "commentThreads",
      {
        part: "snippet",
        videoId,
        order: "relevance",
        maxResults: "20",
        textFormat: "plainText",
        ...(pageToken ? { pageToken } : {}),
      },
      60 * 30,
    );
    return { items: data.items.map(mapComment), nextPageToken: data.nextPageToken };
  } catch {
    // commentsDisabled or unavailable → render nothing gracefully.
    return { items: [] };
  }
}

/* ----------------------------- Channel ----------------------------- */

export async function getChannel(channelId: string): Promise<ChannelSummary | null> {
  const data = await yt<{ items: any[] }>("channels", {
    part: "snippet,statistics,brandingSettings,contentDetails",
    id: channelId,
  });
  const item = data.items?.[0];
  if (!item) return null;
  return {
    id: item.id,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    avatar:
      item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
    banner: item.brandingSettings?.image?.bannerExternalUrl,
    subscriberCount: item.statistics?.subscriberCount
      ? Number(item.statistics.subscriberCount)
      : undefined,
    videoCount: item.statistics?.videoCount ? Number(item.statistics.videoCount) : undefined,
    // Every channel has an auto-generated "uploads" playlist containing its
    // entire library, in order — the correct source for the videos grid.
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

/* ----------------------------- Playlist ----------------------------- */

export async function getPlaylist(playlistId: string): Promise<PlaylistSummary | null> {
  const data = await yt<{ items: any[] }>("playlists", {
    part: "snippet,contentDetails",
    id: playlistId,
  });
  const item = data.items?.[0];
  return item ? mapPlaylistResult(item) : null;
}

export async function getPlaylistItemsPage(
  playlistId: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  const data = await yt<{ items: any[]; nextPageToken?: string }>("playlistItems", {
    part: "snippet,contentDetails",
    playlistId,
    maxResults: "50", // playlistItems max — fewer round-trips for big channels
    ...(pageToken ? { pageToken } : {}),
  });
  const ids = (data.items ?? [])
    .map((i) => i.contentDetails?.videoId ?? i.snippet?.resourceId?.videoId)
    .filter(Boolean);
  return hydrateVideoIds(ids, data.nextPageToken);
}

/* --------------------- Authenticated (OAuth) calls --------------------- */

/**
 * Fetch with a user's Google Bearer token instead of the API key. These
 * responses are per-user, so they MUST NOT be cached/shared — hence no-store.
 */
async function ytAuth<T>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new YouTubeApiError(
      res.status,
      `YouTube ${res.status} on ${path}: ${detail.slice(0, 200)}`,
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Personalized "subscriptions" feed: the latest uploads from the channels the
 * user follows, merged and sorted newest-first.
 *
 * NOTE: There is no public API for YouTube's actual recommendation home feed
 * (activities.list(home=true) was removed years ago, and mine=true returns only
 * the user's OWN activity). Subscriptions' latest uploads is the closest
 * authentic personalized feed the API exposes.
 *
 * Only subscriptions.list needs the token; channels/playlistItems/videos are
 * public data fetched with the key so they stay cached and cheap.
 */
export async function getSubscriptionsFeed(
  token: string,
  pageToken?: string,
): Promise<Page<VideoSummary>> {
  const subs = await ytAuth<{ items: any[]; nextPageToken?: string }>(
    "subscriptions",
    {
      part: "snippet",
      mine: "true",
      maxResults: "25",
      order: "relevance",
      ...(pageToken ? { pageToken } : {}),
    },
    token,
  );

  const channelIds = subs.items
    .map((i) => i.snippet?.resourceId?.channelId)
    .filter(Boolean);
  if (channelIds.length === 0) return { items: [], nextPageToken: subs.nextPageToken };

  // Resolve each subscribed channel's uploads playlist (public → key + cache).
  const ch = await yt<{ items: any[] }>("channels", {
    part: "contentDetails",
    id: channelIds.slice(0, 50).join(","),
    maxResults: "50",
  });
  const uploads = ch.items
    .map((c) => c.contentDetails?.relatedPlaylists?.uploads)
    .filter(Boolean);

  // Pull the few most recent uploads from each channel in parallel.
  const perChannel = await Promise.all(
    uploads.map(async (playlistId: string) => {
      try {
        const r = await yt<{ items: any[] }>("playlistItems", {
          part: "contentDetails",
          playlistId,
          maxResults: "3",
        });
        return (r.items ?? [])
          .map((it) => it.contentDetails?.videoId)
          .filter(Boolean) as string[];
      } catch {
        return [] as string[];
      }
    }),
  );

  const ids = [...new Set(perChannel.flat())].slice(0, 45);
  const page = await hydrateVideoIds(ids, subs.nextPageToken);
  page.items.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return page;
}