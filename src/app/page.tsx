import { Suspense } from "react";
import { CategoryBar } from "@/components/category-bar";
import { HomeFeed } from "@/components/home-feed";
import { VideoGridSkeleton } from "@/components/video-skeleton";
import { getTrendingPage } from "@/lib/youtube";

export const revalidate = 1800;

async function Feed({ category }: { category: string }) {
  const initial = await getTrendingPage(category);
  return <HomeFeed initial={initial} category={category} />;
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
      <Suspense key={category} fallback={<VideoGridSkeleton />}>
        <Feed category={category} />
      </Suspense>
    </div>
  );
}
