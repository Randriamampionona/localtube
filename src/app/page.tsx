import { Suspense } from "react";
import { CategoryBar } from "@/components/category-bar";
import { HomeFeed } from "@/components/home-feed";
import { VideoGridSkeleton } from "@/components/video-skeleton";
import { getGoogleAccessToken } from "@/lib/google";
import { getSubscriptionsFeed, getTrendingPage } from "@/lib/youtube";
import type { Page, VideoSummary } from "@/types/youtube";

// Personalized feeds are per-user; keep this route dynamic (auth() already does).
export const revalidate = 1800;

async function Feed({ category }: { category: string }) {
  let initial: Page<VideoSummary> | null = null;
  let personalized = false;

  if (category === "all") {
    const token = await getGoogleAccessToken();
    if (token) {
      try {
        const page = await getSubscriptionsFeed(token);
        if (page.items.length) {
          initial = page;
          personalized = true;
        }
      } catch {
        /* fall back to trending below */
      }
    }
  }

  if (!initial) initial = await getTrendingPage(category);

  return <HomeFeed initial={initial} category={category} personalized={personalized} />;
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
