import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getComments, getRelatedPage, getVideo } from "@/lib/youtube";
import { isFavorite } from "@/server/library";
import { formatCount, timeAgo } from "@/lib/format";
import { VideoPlayer } from "@/components/watch/video-player";
import { FavoriteButton } from "@/components/watch/favorite-button";
import { RelatedFeed } from "@/components/watch/related-feed";
import { Comments } from "@/components/watch/comments";
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

  const seed = video.tags?.slice(0, 3).join(" ") || video.title;

  const [related, comments, saved] = await Promise.all([
    getRelatedPage(seed, video.id),
    getComments(video.id),
    isFavorite(video.id),
  ]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <VideoPlayer videoId={video.id} title={video.title} />

        <h1 className="mt-4 text-xl font-semibold leading-tight">{video.title}</h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/channel/${video.channelId}`} className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-full bg-secondary">
              {video.channelAvatar ? (
                <Image src={video.channelAvatar} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                <span className="grid size-10 place-items-center font-semibold">
                  {video.channelTitle.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
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

        <Comments initial={comments} videoId={video.id} />
      </div>

      <RelatedFeed initial={related} seed={seed} excludeId={video.id} />
    </div>
  );
}
