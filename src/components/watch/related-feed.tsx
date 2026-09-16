"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadRelated } from "@/server/feed";
import { formatCount, timeAgo } from "@/lib/format";
import type { Page, VideoSummary } from "@/types/youtube";

export function RelatedFeed({
  initial,
  seed,
  excludeId,
}: {
  initial: Page<VideoSummary>;
  seed: string;
  excludeId: string;
}) {
  const loader = React.useCallback(
    (token: string) => loadRelated(seed, excludeId, token),
    [seed, excludeId],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (v) => v.id,
  );

  return (
    <aside className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Up next</h2>
      {items.map((r) => (
        <Link key={r.id} href={`/watch?v=${r.id}`} className="group flex gap-2">
          <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={r.thumbnail} alt="" fill sizes="160px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
              {r.title}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {r.channelTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {r.viewCount !== undefined && <>{formatCount(r.viewCount)} views · </>}
              {timeAgo(r.publishedAt)}
            </p>
          </div>
        </Link>
      ))}
      <FeedStatus
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        error={error}
        variant="sidebar"
        showEnd={false}
      />
    </aside>
  );
}
