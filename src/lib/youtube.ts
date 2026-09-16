import "server-only";
import type {
  ChannelSummary,
  VideoDetail,
  VideoSummary,
} from "@/types/youtube";

const BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Thin, typed wrapper over the YouTube Data API v3.
 *
 * Every call runs on the server (the API key must never reach the browser) and
 * uses Next's fetch cache with a revalidate window to keep quota usage sane —
 * the free quota is 10,000 units/day and search alone costs 100 units/call.
 */
function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

async function yt<T>(
  path: string,
  params: Record<string, string>,
  revalidate = 60 * 30,
): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  Object.entries({ ...params, key: apiKey() }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );

  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`YouTube API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
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
    thumbnail:
      s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? "",
    channelId: s.channelId ?? "",
    channelTitle: s.channelTitle ?? "",
    publishedAt: s.publishedAt ?? "",
    viewCount: stats.viewCount ? Number(stats.viewCount) : undefined,
    likeCount: stats.likeCount ? Number(stats.likeCount) : undefined,
    duration: item.contentDetails?.duration,
    tags: s.tags,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ----------------------------- Endpoints ----------------------------- */

const CATEGORY_QUERY: Record<string, string> = {
  music: "music",
  gaming: "gaming",
  tech: "technology",
  news: "news today",
  sports: "sports highlights",
  movies: "movie trailer",
};

/** Trending feed for the home page. `all` uses the mostPopular chart. */
export async function getTrending(
  category = "all",
  regionCode = "US",
): Promise<VideoSummary[]> {
  if (category === "all") {
    const data = await yt<{ items: any[] }>("videos", {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      maxResults: "24",
      regionCode,
    });
    return data.items.map(mapVideoItem);
  }
  // Category feeds go through search + a details hydration pass.
  return searchVideos(CATEGORY_QUERY[category] ?? category, 24);
}

/** Full-text search. Costs 100 quota units per call — cache aggressively. */
export async function searchVideos(
  query: string,
  maxResults = 20,
): Promise<VideoSummary[]> {
  const search = await yt<{ items: any[] }>(
    "search",
    {
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(maxResults),
    },
    60 * 10,
  );

  const ids = search.items
    .map((i) => i.id?.videoId)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];

  // Hydrate with statistics/duration in a single cheap videos.list call.
  const details = await yt<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids,
  });
  return details.items.map(mapVideoItem);
}

export async function getVideo(id: string): Promise<VideoDetail | null> {
  const data = await yt<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id,
  });
  return data.items[0] ? mapVideoItem(data.items[0]) : null;
}

/** Related videos sidebar — YouTube deprecated relatedToVideoId, so we
 *  approximate with a search on the source video's title/tags. */
export async function getRelated(video: VideoDetail): Promise<VideoSummary[]> {
  const seed = video.tags?.slice(0, 3).join(" ") || video.title;
  const results = await searchVideos(seed, 12);
  return results.filter((v) => v.id !== video.id);
}

export async function getChannel(
  channelId: string,
): Promise<ChannelSummary | null> {
  const data = await yt<{ items: any[] }>("channels", {
    part: "snippet,statistics,brandingSettings",
    id: channelId,
  });
  const item = data.items?.[0];
  if (!item) return null;
  return {
    id: item.id,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    avatar:
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
    banner: item.brandingSettings?.image?.bannerExternalUrl,
    subscriberCount: item.statistics?.subscriberCount
      ? Number(item.statistics.subscriberCount)
      : undefined,
    videoCount: item.statistics?.videoCount
      ? Number(item.statistics.videoCount)
      : undefined,
  };
}

export async function getChannelVideos(
  channelId: string,
): Promise<VideoSummary[]> {
  const search = await yt<{ items: any[] }>("search", {
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: "24",
  });
  const ids = search.items
    .map((i) => i.id?.videoId)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];
  const details = await yt<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids,
  });
  return details.items.map(mapVideoItem);
}
