"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Search,
  Play,
  Menu,
  X,
  Home,
  Library,
  ListVideo,
  Bookmark,
} from "lucide-react";
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

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Favorites", icon: Bookmark },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/library", label: "Library", icon: Library },
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Mobile: hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="grid size-10 place-items-center rounded-full hover:bg-secondary md:hidden"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Play className="size-4 fill-current" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">LocalTube</span>
        </Link>

        {/* Desktop search */}
        <form
          onSubmit={submit}
          className="mx-auto hidden w-full max-w-2xl items-center gap-2 md:flex"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            aria-label="Search type"
            className="h-10 rounded-full border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* Mobile: search toggle */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center rounded-full hover:bg-secondary md:hidden"
          >
            <Search className="size-5" />
          </button>
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

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 flex h-16 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
          <form onSubmit={submit} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search videos"
                aria-label="Search videos"
                className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
        </div>
      )}

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <nav className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col gap-1 bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Play className="size-4 fill-current" />
                </span>
                LocalTube
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="grid size-9 place-items-center rounded-full hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
