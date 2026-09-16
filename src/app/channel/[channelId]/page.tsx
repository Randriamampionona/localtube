import { notFound } from "next/navigation";
import Image from "next/image";
import { getChannel, getChannelVideos } from "@/lib/youtube";
import { formatCount } from "@/lib/format";
import { VideoGrid } from "@/components/video-grid";

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { channelId } = await params;
  const { tab = "videos" } = await searchParams;

  const channel = await getChannel(channelId);
  if (!channel) notFound();

  const videos = tab === "videos" ? await getChannelVideos(channelId) : [];

  return (
    <div className="mx-auto max-w-6xl">
      {channel.banner && (
        <div className="relative mb-4 aspect-[6/1] w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={channel.banner}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative size-20 overflow-hidden rounded-full bg-secondary">
          {channel.avatar && (
            <Image src={channel.avatar} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{channel.title}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatCount(channel.subscriberCount)} subscribers ·{" "}
            {formatCount(channel.videoCount)} videos
          </p>
        </div>
      </div>

      <nav className="mt-6 flex gap-6 border-b border-border text-sm font-medium">
        {(["videos", "playlists", "about"] as const).map((t) => (
          <a
            key={t}
            href={`/channel/${channelId}?tab=${t}`}
            className={
              tab === t
                ? "border-b-2 border-foreground pb-3 capitalize"
                : "pb-3 capitalize text-muted-foreground hover:text-foreground"
            }
          >
            {t}
          </a>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "videos" && <VideoGrid videos={videos} />}
        {tab === "playlists" && (
          <p className="text-muted-foreground">
            Playlists listing uses playlists.list — wire it up the same way as
            getChannelVideos.
          </p>
        )}
        {tab === "about" && (
          <p className="max-w-2xl whitespace-pre-wrap text-muted-foreground">
            {channel.description || "No description."}
          </p>
        )}
      </div>
    </div>
  );
}
