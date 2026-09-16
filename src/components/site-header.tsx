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

export function SiteHeader() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
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
          className="mx-auto flex w-full max-w-xl items-center"
        >
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
