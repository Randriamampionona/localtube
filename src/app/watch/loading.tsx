import { Skeleton } from "@/components/ui/skeleton";

export default function WatchLoading() {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="mt-4 h-6 w-3/4" />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="aspect-video w-40 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
