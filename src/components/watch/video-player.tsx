"use client";

import * as React from "react";
import { ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Domain = "youtube.com" | "youtube-nocookie.com";
const STORAGE_KEY = "localtube:privacy-embed";

/**
 * Embedded YouTube player with a runtime domain switch:
 *  - youtube.com            → full controls, participates in the cookie/consent
 *                             flow (best default for most setups).
 *  - youtube-nocookie.com   → privacy mode, fewer cookies; useful if the
 *                             standard domain triggers the sign-in/bot gate.
 *
 * The choice is remembered per-browser in localStorage. `defaultPrivacy` sets
 * the initial value before any stored preference is read.
 */
export function VideoPlayer({
  videoId,
  title,
  defaultPrivacy = false,
}: {
  videoId: string;
  title: string;
  defaultPrivacy?: boolean;
}) {
  const [noCookie, setNoCookie] = React.useState(defaultPrivacy);

  // Load any saved preference after mount (avoids hydration mismatch).
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setNoCookie(saved === "1");
    } catch {
      /* localStorage unavailable — fall back to the default */
    }
  }, []);

  function toggle() {
    setNoCookie((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore persistence failure */
      }
      return next;
    });
  }

  const domain: Domain = noCookie ? "youtube-nocookie.com" : "youtube.com";
  const src = `https://www.${domain}/embed/${videoId}?rel=0&controls=1&playsinline=1&fs=1`;

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          // Remount on domain change so the player reloads cleanly.
          key={domain}
          className="absolute inset-0 size-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={noCookie}
          title={
            noCookie
              ? "Privacy mode on (youtube-nocookie.com)"
              : "Privacy mode off (youtube.com)"
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            noCookie
              ? "bg-accent/15 text-accent hover:bg-accent/25"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {noCookie ? (
            <ShieldCheck className="size-3.5" />
          ) : (
            <Shield className="size-3.5" />
          )}
          Privacy mode {noCookie ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
