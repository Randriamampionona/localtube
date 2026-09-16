import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaylist, getPlaylistItemsPage } from "@/lib/youtube";
import { PlaylistItems } from "@/components/playlist/playlist-items";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;

  const [playlist, initial] = await Promise.all([
    getPlaylist(playlistId),
    getPlaylistItemsPage(playlistId),
  ]);
  if (!playlist) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{playlist.title}</h1>
        <Link
          href={`/channel/${playlist.channelId}`}
          className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          {playlist.channelTitle}
        </Link>
        {playlist.itemCount !== undefined && (
          <p className="text-sm text-muted-foreground">{playlist.itemCount} videos</p>
        )}
        {playlist.description && (
          <p className="mt-3 line-clamp-3 max-w-2xl text-sm text-muted-foreground">
            {playlist.description}
          </p>
        )}
      </header>

      <PlaylistItems initial={initial} playlistId={playlistId} />
    </div>
  );
}
