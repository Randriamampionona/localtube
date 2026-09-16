import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { searchVideos } from "@/lib/youtube";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";
import { VideoGridSkeleton } from "@/components/video-skeleton";

async function Results({ q }: { q: string }) {
  const videos = await searchVideos(q, 20);
  if (videos.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No results for “{q}”.
      </p>
    );
  }
  return (
    <ul className="mx-auto max-w-4xl space-y-4">
      {videos.map((v) => (
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
              <p className="mt-2 text-sm text-muted-foreground">
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
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">
        {q ? `Results for “${q}”` : "Search"}
      </h1>
      {q ? (
        <Suspense key={q} fallback={<VideoGridSkeleton count={6} />}>
          <Results q={q} />
        </Suspense>
      ) : (
        <p className="text-muted-foreground">Type a query in the search bar.</p>
      )}
    </div>
  );
}
