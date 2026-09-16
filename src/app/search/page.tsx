import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { searchVideos } from "@/lib/youtube";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";
import { VideoGridSkeleton } from "@/components/video-skeleton";
import { decodeQuery } from "@/lib/crypto";

async function Results({ query }: { query: string }) {
  const videos = await searchVideos(query, 20);
  if (videos.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No results for “{query}”.
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
  const { q } = await searchParams;
  // Decode the obfuscated token. null = missing or corrupted → clean state.
  const query = decodeQuery(q);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">
        {query ? `Results for “${query}”` : "Search"}
      </h1>

      {query ? (
        <Suspense key={query} fallback={<VideoGridSkeleton count={6} />}>
          <Results query={query} />
        </Suspense>
      ) : q ? (
        // A `q` was present but couldn't be decoded — fail gracefully.
        <p className="text-muted-foreground">
          That search link looks invalid. Try searching again from the bar above.
        </p>
      ) : (
        <p className="text-muted-foreground">Type a query in the search bar.</p>
      )}
    </div>
  );
}
