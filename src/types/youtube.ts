export interface VideoSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string; // hydrated via a batched channels.list call
  publishedAt: string;
  viewCount?: number;
  duration?: string; // ISO 8601, e.g. "PT4M13S"
}

export interface VideoDetail extends VideoSummary {
  likeCount?: number;
  tags?: string[];
}

export interface ChannelSummary {
  id: string;
  title: string;
  description: string;
  avatar: string;
  banner?: string;
  subscriberCount?: number;
  videoCount?: number;
  uploadsPlaylistId?: string; // contentDetails.relatedPlaylists.uploads
}

/** A channel as it appears in search results (type=channel). */
export interface ChannelResult {
  id: string;
  title: string;
  description: string;
  avatar: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  itemCount?: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export type CategoryId =
  | "all"
  | "music"
  | "gaming"
  | "tech"
  | "news"
  | "sports"
  | "movies";

export type SearchType = "video" | "playlist" | "channel" | "live";

/** A single page of results plus the token for the next page (if any). */
export interface Page<T> {
  items: T[];
  nextPageToken?: string;
}

export type SearchItem = VideoSummary | ChannelResult | PlaylistSummary;
