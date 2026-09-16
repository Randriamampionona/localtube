import type { VideoSummary } from "@/types/youtube";
import { VideoCard } from "@/components/video-card";

export function VideoGrid({ videos }: { videos: VideoSummary[] }) {
  if (videos.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No videos to show. Try another category or search.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
