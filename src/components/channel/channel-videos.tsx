"use client";

import * as React from "react";
import { VideoCard } from "@/components/video-card";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadPlaylistItems } from "@/server/feed";
import type { Page, VideoSummary } from "@/types/youtube";

/**
 * A channel's full video library = its auto-generated "uploads" playlist.
 * We page through it with playlistItems (50/page) rather than search.list,
 * which returns the complete catalogue in order and costs far less quota.
 */
export function ChannelVideos({
  initial,
  uploadsPlaylistId,
}: {
  initial: Page<VideoSummary>;
  uploadsPlaylistId: string;
}) {
  const loader = React.useCallback(
    (token: string) => loadPlaylistItems(uploadsPlaylistId, token),
    [uploadsPlaylistId],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (v) => v.id,
  );

  if (items.length === 0 && done) {
    return <p className="text-muted-foreground">This channel has no videos.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
      <FeedStatus sentinelRef={sentinelRef} loading={loading} done={done} error={error} variant="grid" />
    </>
  );
}
