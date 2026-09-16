export interface VideoSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
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
}

export type CategoryId =
  | "all"
  | "music"
  | "gaming"
  | "tech"
  | "news"
  | "sports"
  | "movies";
