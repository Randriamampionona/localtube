"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---- Minimal typings for YouTube IFrame API ---- */
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

// List of online proxy services for inline playback fallback
const MIRROR_SERVICES = [
  { name: "Invidious (Yewtu.be)", url: (id: string) => `https://yewtu.be/embed/${id}?autoplay=1` },
  { name: "Invidious (Nadeko)", url: (id: string) => `https://inv.nadeko.net/embed/${id}?autoplay=1` },
  { name: "Piped Video", url: (id: string) => `https://piped.video/embed/${id}?autoplay=1` },
];

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
  const [mirrorIndex, setMirrorIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setNoCookie(saved === "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Initialize YouTube IFrame API
  React.useEffect(() => {
    let cancelled = false;
    setErrorCode(null);
    setMirrorIndex(null);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      hostRef.current.innerHTML = "";
      const mount = document.createElement("div");
      mount.className = "size-full";
      hostRef.current.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        host: noCookie
          ? "https://www.youtube-nocookie.com"
          : "https://www.youtube.com",
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
            if (!cancelled) {
              setErrorCode(e.data);
              // Automatically switch to first online proxy mirror on embed block
              setMirrorIndex(0);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, noCookie]);

  function togglePrivacy() {
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

  function cycleNextMirror() {
    setMirrorIndex((prev) =>
      prev === null ? 0 : (prev + 1) % MIRROR_SERVICES.length
    );
  }

  const activeMirror = mirrorIndex !== null ? MIRROR_SERVICES[mirrorIndex] : null;

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {/* Standard YouTube Player */}
        <div ref={hostRef} className="absolute inset-0 size-full" />

        {/* Inline Proxy Mirror Bridge (Keeps playback entirely inside the player container) */}
        {activeMirror && (
          <iframe
            key={`${activeMirror.name}-${videoId}`}
            className="absolute inset-0 z-10 size-full border-0"
            src={activeMirror.url(videoId)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {errorCode !== null && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-500">
              <AlertTriangle className="size-3.5" /> Restricted Embed
            </span>
          )}

          <button
            type="button"
            onClick={cycleNextMirror}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            Source: {activeMirror ? activeMirror.name : "YouTube Standard"}
          </button>
        </div>

        <button
          type="button"
          onClick={togglePrivacy}
          aria-pressed={noCookie}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
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