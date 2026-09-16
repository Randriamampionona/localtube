"use client";

import * as React from "react";
import Image from "next/image";
import { FeedStatus } from "@/components/feed-status";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { loadComments } from "@/server/feed";
import { formatCount, timeAgo } from "@/lib/format";
import type { Comment, Page } from "@/types/youtube";

export function Comments({
  initial,
  videoId,
}: {
  initial: Page<Comment>;
  videoId: string;
}) {
  const loader = React.useCallback(
    (token: string) => loadComments(videoId, token),
    [videoId],
  );
  const { items, sentinelRef, loading, done, error } = useInfiniteScroll(
    initial,
    loader,
    (c) => c.id,
  );

  if (items.length === 0 && done) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Comments are turned off or unavailable for this video.
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-base font-semibold">Comments</h2>
      <ul className="space-y-5">
        {items.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-secondary">
              {c.avatar && (
                <Image src={c.avatar} alt="" fill sizes="36px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium">{c.author}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  {timeAgo(c.publishedAt)}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {c.text}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCount(c.likeCount)} likes
              </p>
            </div>
          </li>
        ))}
      </ul>
      <FeedStatus
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        error={error}
        variant="none"
        showEnd={false}
      />
    </section>
  );
}
