"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Search, Play } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { encodeQuery, decodeQuery } from "@/lib/crypto";
import type { SearchType } from "@/types/youtube";

const TYPES: { id: SearchType; label: string }[] = [
  { id: "video", label: "Videos" },
  { id: "playlist", label: "Playlists" },
  { id: "channel", label: "Channels" },
  { id: "live", label: "Live" },
];

export function SiteHeader() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(() => decodeQuery(params.get("q")) ?? "");
  const [type, setType] = React.useState<SearchType>(
    (params.get("type") as SearchType) || "video",
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    const qs = new URLSearchParams({ q: encodeQuery(trimmed) });
    if (type !== "video") qs.set("type", type);
    router.push(`/search?${qs.toString()}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Play className="size-4 fill-current" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">
            LocalTube
          </span>
        </Link>

        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-2xl items-center gap-2"
        >
          {/* Content-type selector (Videos / Playlists / Channels / Live). */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            aria-label="Search type"
            className="hidden h-10 rounded-full border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
          >
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search videos"
              aria-label="Search videos"
              className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
