import { Suspense } from "react";
import { decodeQuery } from "@/lib/crypto";
import { isTermFollowed } from "@/server/terms";
import { FollowTermButton } from "@/components/search/follow-term-button";
import { searchPage } from "@/lib/youtube";
import { SearchResults } from "@/components/search/search-results";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { VideoGridSkeleton } from "@/components/video-skeleton";
import type { SearchType } from "@/types/youtube";

const VALID: SearchType[] = ["video", "playlist", "channel", "live"];
function normalizeType(t?: string): SearchType {
  return VALID.includes(t as SearchType) ? (t as SearchType) : "video";
}

async function Results({ query, type }: { query: string; type: SearchType }) {
  const initial = await searchPage(query, type);
  return <SearchResults initial={initial} query={query} type={type} />;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: rawType } = await searchParams;
  const query = decodeQuery(q);
  const type = normalizeType(rawType);
  const followed = query ? await isTermFollowed(query) : false;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          {query ? `Results for “${query}”` : "Search"}
        </h1>
        {query && <FollowTermButton term={query} initialFollowed={followed} />}
      </div>

      {query ? (
        <>
          <SearchTypeTabs active={type} />
          <Suspense key={`${query}:${type}`} fallback={<VideoGridSkeleton count={6} />}>
            <Results query={query} type={type} />
          </Suspense>
        </>
      ) : q ? (
        <p className="text-muted-foreground">
          That search link looks invalid. Try searching again from the bar above.
        </p>
      ) : (
        <p className="text-muted-foreground">Type a query in the search bar.</p>
      )}
    </div>
  );
}
