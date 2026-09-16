import { Suspense } from "react";
import { CategoryBar } from "@/components/category-bar";
import { VideoGrid } from "@/components/video-grid";
import { VideoGridSkeleton } from "@/components/video-skeleton";
import { getTrending } from "@/lib/youtube";

// Feeds refresh on the server every 30 min (see revalidate in the YT service).
export const revalidate = 1800;

async function TrendingFeed({ category }: { category: string }) {
  const videos = await getTrending(category);
  return <VideoGrid videos={videos} />;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;

  return (
    <div>
      <CategoryBar />
      {/* key forces a fresh Suspense boundary when the category changes. */}
      <Suspense key={category} fallback={<VideoGridSkeleton />}>
        <TrendingFeed category={category} />
      </Suspense>
    </div>
  );
}
