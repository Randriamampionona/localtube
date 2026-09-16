import { VideoGridSkeleton } from "@/components/video-skeleton";

// Route-transition fallback for segments without their own loading.tsx
// (home, search, channel, playlist). Shown instantly on navigation.
export default function Loading() {
  return (
    <div className="py-4">
      <VideoGridSkeleton />
    </div>
  );
}
