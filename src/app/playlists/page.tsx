import { ListVideo } from "lucide-react";
import { listPlaylists } from "@/server/library";

interface Playlist {
  id: string;
  title: string;
  items?: { videoId: string; thumbnail: string }[];
}

export default async function PlaylistsPage() {
  const playlists = (await listPlaylists()) as Playlist[];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold">Your playlists</h1>

      {playlists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No playlists yet. Use “Add to playlist” on a video to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 text-primary">
                <ListVideo className="size-5" />
                <span className="font-semibold text-card-foreground">
                  {p.title}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.items?.length ?? 0} videos
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
