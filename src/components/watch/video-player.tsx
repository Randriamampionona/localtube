export function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        className="absolute inset-0 size-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
