"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { FollowedTerm } from "@/server/terms";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "gaming", label: "Gaming" },
  { id: "tech", label: "Tech" },
  { id: "news", label: "News" },
  { id: "sports", label: "Sports" },
  { id: "movies", label: "Movies" },
] as const;

export function CategoryBar({ followed = [] }: { followed?: FollowedTerm[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("category") ?? "all";

  function select(id: string) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("category");
    else next.set("category", id);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // A followed term runs its saved (obfuscated) search in one click.
  function openTerm(t: FollowedTerm) {
    router.push(`/search?q=${t.encodedHash}`);
  }

  return (
    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto bg-background px-4 py-3 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => select(c.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === c.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
          )}
        >
          {c.label}
        </button>
      ))}

      {followed.length > 0 && (
        <span
          aria-hidden
          className="mx-1 w-px shrink-0 self-stretch bg-border"
        />
      )}

      {followed.map((t) => (
        <button
          key={t.id}
          onClick={() => openTerm(t)}
          title={`Search "${t.term}"`}
          className="shrink-0 rounded-full bg-accent/15 px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/25"
        >
          {t.term}
        </button>
      ))}
    </div>
  );
}
