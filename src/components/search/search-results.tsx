"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadSearch } from "@/server/feed";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";
import type {
  ChannelResult,
  Page,
  PlaylistSummary,
  SearchItem,
  SearchType,
  VideoSummary,
} from "@/types/youtube";

export function SearchResults({
  initial,
  query,
  type,
}: {
  initial: Page<SearchItem>;
  query: string;
  type: SearchType;
}) {
  const loader = React.useCallback(
    (token: string) => loadSearch(query, type, token),
    [query, type],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (it) => it.id,
  );

  if (items.length === 0 && done) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No results for “{query}”.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {type === "channel" ? (
        <ul className="space-y-4">
          {(items as ChannelResult[]).map((c) => (
            <li key={c.id}>
              <Link href={`/channel/${c.id}`} className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
                  {c.avatar && (
                    <Image src={c.avatar} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : type === "playlist" ? (
        <ul className="space-y-4">
          {(items as PlaylistSummary[]).map((p) => (
            <li key={p.id}>
              <Link href={`/playlist/${p.id}`} className="group flex gap-4">
                <div className="relative aspect-video w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.thumbnail && (
                    <Image src={p.thumbnail} alt="" fill sizes="240px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.channelTitle}</p>
                  {p.itemCount !== undefined && (
                    <p className="text-sm text-muted-foreground">{p.itemCount} videos</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-4">
          {(items as VideoSummary[]).map((v) => (
            <li key={v.id}>
              <Link href={`/watch?v=${v.id}`} className="group flex gap-4">
                <div className="relative aspect-video w-full max-w-[360px] shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={v.thumbnail}
                    alt=""
                    fill
                    sizes="360px"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                      {formatDuration(v.duration)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCount(v.viewCount)} views · {timeAgo(v.publishedAt)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    {v.channelAvatar && (
                      <Image
                        src={v.channelAvatar}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 rounded-full object-cover"
                      />
                    )}
                    {v.channelTitle}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FeedStatus
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        error={error}
        variant="list"
      />
    </div>
  );
}
