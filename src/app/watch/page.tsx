import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getRelated, getVideo } from "@/lib/youtube";
import { isFavorite } from "@/server/library";
import { formatCount, timeAgo } from "@/lib/format";
import { VideoPlayer } from "@/components/watch/video-player";
import { FavoriteButton } from "@/components/watch/favorite-button";
import { DescriptionToggle } from "./description-toggle";

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  if (!v) notFound();

  const video = await getVideo(v);
  if (!video) notFound();

  const [related, saved] = await Promise.all([
    getRelated(video),
    isFavorite(video.id),
  ]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1fr_360px]">
      {/* Primary column */}
      <div className="min-w-0">
        <VideoPlayer videoId={video.id} title={video.title} />

        <h1 className="mt-4 text-xl font-semibold leading-tight">
          {video.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/channel/${video.channelId}`}
            className="flex items-center gap-3"
          >
            <span className="grid size-10 place-items-center rounded-full bg-secondary font-semibold">
              {video.channelTitle.charAt(0).toUpperCase()}
            </span>
            <span className="font-medium">{video.channelTitle}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium tabular-nums">
              {formatCount(video.likeCount)} likes
            </span>
            <FavoriteButton
              initialSaved={saved}
              video={{
                videoId: video.id,
                title: video.title,
                channelTitle: video.channelTitle,
                thumbnail: video.thumbnail,
              }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
          <p className="font-medium tabular-nums">
            {formatCount(video.viewCount)} views · {timeAgo(video.publishedAt)}
          </p>
          <DescriptionToggle text={video.description} />
        </div>
      </div>

      {/* Related sidebar */}
      <aside className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Up next
        </h2>
        {related.slice(0, 10).map((r) => (
          <Link
            key={r.id}
            href={`/watch?v=${r.id}`}
            className="group flex gap-2"
          >
            <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={r.thumbnail}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                {r.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {r.channelTitle}
              </p>
            </div>
          </Link>
        ))}
      </aside>
    </div>
  );
}
