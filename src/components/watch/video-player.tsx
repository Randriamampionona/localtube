"use client";

import * as React from "react";
import { AlertTriangle, PictureInPicture2, Shield, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---- Minimal typings for the YouTube IFrame Player API (no `any`) ---- */
interface YTPlayer {
  destroy: () => void;
}
interface YTErrorEvent {
  data: number;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YTNamespace>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

const STORAGE_KEY = "localtube:privacy-embed";
const EMBED_BLOCKED = new Set([100, 101, 150]);
const API_TIMEOUT = 4000; // if the IFrame API can't load, fall back to a plain embed

export function VideoPlayer({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<YTPlayer | null>(null);
  const [noCookie, setNoCookie] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<number | null>(null);
  const [bridgeActive, setBridgeActive] = React.useState(false);
  // If the IFrame API is blocked/slow, we render a plain iframe so the video
  // ALWAYS plays. That's the reliability net that keeps playback working.
  const [apiFailed, setApiFailed] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setNoCookie(saved === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const domain = noCookie
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";

  React.useEffect(() => {
    let cancelled = false;
    setErrorCode(null);
    setBridgeActive(false);
    setApiFailed(false);

    // Fallback if the API never initializes (ad-blocker, CSP, network).
    const timer = window.setTimeout(() => {
      if (!cancelled && !playerRef.current) setApiFailed(true);
    }, API_TIMEOUT);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        window.clearTimeout(timer);
        hostRef.current.innerHTML = "";
        const mount = document.createElement("div");
        mount.className = "size-full";
        hostRef.current.appendChild(mount);

        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          host: domain,
          playerVars: {
            rel: 0,
            controls: 1,
            playsinline: 1,
            fs: 1,
            modestbranding: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
          },
          events: {
            onError: (e: YTErrorEvent) => {
              if (!cancelled) setErrorCode(e.data);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setApiFailed(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, domain]);

  function toggle() {
    setNoCookie((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const blocked = errorCode !== null;
  const ageRestricted = errorCode !== null && EMBED_BLOCKED.has(errorCode);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {apiFailed ? (
          // Reliable plain-embed fallback — always plays normal videos.
          <iframe
            key={`fallback-${videoId}-${noCookie}`}
            className="absolute inset-0 size-full"
            src={`${domain}/embed/${videoId}?rel=0&controls=1&playsinline=1&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div ref={hostRef} className="absolute inset-0 size-full" />
        )}

        {/* In-box bridge (button-triggered), no popup. */}
        {blocked && bridgeActive && (
          <>
            <iframe
              key={`bridge-${videoId}`}
              className="absolute inset-0 z-10 size-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&playsinline=1&rel=0`}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setBridgeActive(false)}
              aria-label="Close bridge"
              className="absolute right-2 top-2 z-20 grid size-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black/85"
            >
              <X className="size-4" />
            </button>
          </>
        )}

        {blocked && !bridgeActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center">
            <AlertTriangle className="size-8 text-accent" />
            <p className="max-w-sm text-sm text-white/90">
              {ageRestricted
                ? "This video is age-restricted or can't be embedded here."
                : "This video can't be played in the embedded player."}
            </p>
            <button
              type="button"
              onClick={() => setBridgeActive(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PictureInPicture2 className="size-4" /> Open Player Bridge
            </button>
          </div>
        )}
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
          {noCookie ? <ShieldCheck className="size-3.5" /> : <Shield className="size-3.5" />}
          Privacy mode {noCookie ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
