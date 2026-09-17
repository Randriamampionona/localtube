"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Variant = "grid" | "list" | "sidebar" | "none";

/**
 * Bottom-of-feed status row for infinite scroll: an invisible sentinel the
 * observer watches, skeleton placeholders while the next page loads, plus
 * error / end-of-feed states.
 */
export function FeedStatus({
  sentinelRef,
  loading,
  done,
  error,
  variant = "grid",
  showEnd = true,
}: {
  sentinelRef: React.Ref<HTMLDivElement>;
  loading: boolean;
  done: boolean;
  error: string | null;
  variant?: Variant;
  showEnd?: boolean;
}) {
  return (
    <div>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {loading && variant === "grid" && (
        <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="mt-3 flex gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && variant === "list" && (
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-video w-full max-w-[360px] rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && variant === "sidebar" && (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="aspect-video w-40 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && variant === "none" && (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {error && (
        <p className="py-6 text-center text-sm text-muted-foreground">{error}</p>
      )}
      {done && showEnd && !loading && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          You&apos;re all caught up.
        </p>
      )}
    </div>
  );
}
