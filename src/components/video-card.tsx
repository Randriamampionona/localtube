import Image from "next/image";
import Link from "next/link";
import type { VideoSummary } from "@/types/youtube";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";

export function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <article className="group">
      <Link
        href={`/watch?v=${video.id}`}
        className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-video bg-muted">
          <Image
            src={video.thumbnail}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {video.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex gap-3">
        <Link
          href={`/channel/${video.channelId}`}
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
          aria-label={video.channelTitle}
        >
          {video.channelTitle.charAt(0).toUpperCase()}
        </Link>
        <div className="min-w-0">
          <Link href={`/watch?v=${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
              {video.title}
            </h3>
          </Link>
          <Link
            href={`/channel/${video.channelId}`}
            className="mt-1 block truncate text-sm text-muted-foreground hover:text-foreground"
          >
            {video.channelTitle}
          </Link>
          <p className="text-sm text-muted-foreground">
            {video.viewCount !== undefined && (
              <>{formatCount(video.viewCount)} views · </>
            )}
            {timeAgo(video.publishedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
