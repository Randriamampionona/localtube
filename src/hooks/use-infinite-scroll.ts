"use client";

import * as React from "react";
import type { Page } from "@/types/youtube";

/**
 * Generic infinite-scroll driver.
 *
 * Seeds with the server-rendered first page, then calls `loader(pageToken)`
 * whenever a sentinel element near the bottom of the list scrolls into view.
 * De-dupes by `getKey` because YouTube search pages can repeat items.
 *
 * Returns a `sentinelRef` to attach to a element at the end of your list.
 */
export function useInfiniteScroll<T>(
  initial: Page<T>,
  loader: (pageToken: string) => Promise<Page<T>>,
  getKey: (item: T) => string,
) {
  const [items, setItems] = React.useState<T[]>(initial.items);
  const [token, setToken] = React.useState<string | undefined>(initial.nextPageToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Reset when the seed changes (e.g. new search term or category).
  React.useEffect(() => {
    setItems(initial.items);
    setToken(initial.nextPageToken);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const done = !token;

  const loadMore = React.useCallback(async () => {
    if (loading || !token) return;
    setLoading(true);
    setError(null);
    try {
      const next = await loader(token);
      setItems((prev) => {
        const seen = new Set(prev.map(getKey));
        const merged = [...prev];
        for (const it of next.items) {
          const k = getKey(it);
          if (!seen.has(k)) {
            seen.add(k);
            merged.push(it);
          }
        }
        return merged;
      });
      setToken(next.nextPageToken);
    } catch {
      setError("Couldn't load more.");
    } finally {
      setLoading(false);
    }
  }, [loading, token, loader, getKey]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }, // prefetch before it's actually visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, done]);

  return { items, sentinelRef, loading, done, error, loadMore };
}
