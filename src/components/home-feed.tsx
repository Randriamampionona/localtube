"use client";

import * as React from "react";
import { VideoCard } from "@/components/video-card";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadTrending } from "@/server/feed";
import type { Page, VideoSummary } from "@/types/youtube";

export function HomeFeed({
  initial,
  category,
}: {
  initial: Page<VideoSummary>;
  category: string;
}) {
  const loader = React.useCallback(
    (token: string) => loadTrending(category, token),
    [category],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (v) => v.id,
  );

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Nothing here right now. Try another category.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
      <FeedStatus
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        error={error}
        variant="grid"
      />
    </>
  );
}
