"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Search, Play, Menu, X } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DrawerNav } from "@/components/side-nav";
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    const qs = new URLSearchParams({ q: encodeQuery(trimmed) });
    if (type !== "video") qs.set("type", type);
    setSearchOpen(false);
    router.push(`/search?${qs.toString()}`);
  }

  const SearchField = (
    <div className="flex w-full items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SearchType)}
        aria-label="Search type"
        className="hidden h-10 rounded-full border border-input bg-secondary/60 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:block"
      >
        {TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search videos"
          className="h-10 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:px-4 lg:px-6">
        {/* Left: menu (mobile/tablet) + brand */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Play className="size-4 fill-current" />
          </span>
          <span className="hidden text-lg sm:inline">LocalTube</span>
        </Link>

        {/* Center: search (md+) */}
        <form onSubmit={submit} className="mx-2 hidden flex-1 justify-center md:flex">
          <div className="w-full max-w-xl">{SearchField}</div>
        </form>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary md:hidden"
          >
            <Search className="size-5" />
          </button>
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="ml-1">Sign in</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="ml-1 grid place-items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 flex h-16 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
          <form onSubmit={submit} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search videos"
                className="h-10 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">Go</Button>
          </form>
        </div>
      )}

      {/* Mobile / tablet navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col gap-2 border-r border-border bg-background p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Play className="size-4 fill-current" />
                </span>
                LocalTube
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <DrawerNav onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
