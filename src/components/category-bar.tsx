"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "gaming", label: "Gaming" },
  { id: "tech", label: "Tech" },
  { id: "news", label: "News" },
  { id: "sports", label: "Sports" },
  { id: "movies", label: "Movies" },
] as const;

export function CategoryBar() {
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

  return (
    // Normal flow (not sticky) + solid background → never overlaps the grid.
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
    </div>
  );
}
