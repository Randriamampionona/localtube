"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadHome } from "@/server/feed";
import type { Page, VideoSummary } from "@/types/youtube";

export function HomeFeed({
  initial,
  category,
  personalized = false,
}: {
  initial: Page<VideoSummary>;
  category: string;
  personalized?: boolean;
}) {
  const loader = React.useCallback(
    (token: string) => loadHome(category, token),
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
      {personalized && (
        <p className="mb-4 flex items-center gap-1.5 text-sm font-medium text-accent">
          <Sparkles className="size-4" />
          From your subscriptions
        </p>
      )}
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
