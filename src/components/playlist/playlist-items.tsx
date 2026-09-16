"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadPlaylistItems } from "@/server/feed";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";
import type { Page, VideoSummary } from "@/types/youtube";

export function PlaylistItems({
  initial,
  playlistId,
}: {
  initial: Page<VideoSummary>;
  playlistId: string;
}) {
  const loader = React.useCallback(
    (token: string) => loadPlaylistItems(playlistId, token),
    [playlistId],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (v) => v.id,
  );

  return (
    <div>
      <ol className="space-y-3">
        {items.map((v, i) => (
          <li key={v.id}>
            <Link href={`/watch?v=${v.id}`} className="group flex items-center gap-3">
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={v.thumbnail} alt="" fill sizes="160px" className="object-cover" />
                {v.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                    {formatDuration(v.duration)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {v.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.channelTitle}
                  {v.viewCount !== undefined && <> · {formatCount(v.viewCount)} views</>}
                  {v.publishedAt && <> · {timeAgo(v.publishedAt)}</>}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <FeedStatus sentinelRef={sentinelRef} loading={loading} done={done} error={error} variant="none" />
    </div>
  );
}
