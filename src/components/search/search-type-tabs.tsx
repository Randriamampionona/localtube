"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types/youtube";

const TABS: { id: SearchType; label: string }[] = [
  { id: "video", label: "Videos" },
  { id: "playlist", label: "Playlists" },
  { id: "channel", label: "Channels" },
  { id: "live", label: "Live" },
];

export function SearchTypeTabs({ active }: { active: SearchType }) {
  const router = useRouter();
  const params = useSearchParams();

  function select(type: SearchType) {
    const next = new URLSearchParams(params);
    next.set("type", type);
    router.push(`/search?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex gap-2 border-b border-border">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => select(t.id)}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            active === t.id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
