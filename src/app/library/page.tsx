import Link from "next/link";
import Image from "next/image";
import { listFavorites } from "@/server/library";

export default async function LibraryPage() {
  const favorites = await listFavorites();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold">Saved videos</h1>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            Nothing saved yet. Tap <span className="font-medium">Save</span> on
            any video to keep it here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Browse videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((v) => (
            <Link key={v.videoId} href={`/watch?v=${v.videoId}`} className="group">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <Image
                  src={v.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width:640px) 100vw, 25vw"
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-primary">
                {v.title}
              </h3>
              <p className="text-sm text-muted-foreground">{v.channelTitle}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
