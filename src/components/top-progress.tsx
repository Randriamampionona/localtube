"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Dependency-free top progress bar for App Router client navigations.
 *
 * App Router has no router start/stop events, so we approximate: a captured
 * click on any internal <a> that changes the URL starts the bar (and popstate
 * for back/forward). It "trickles" toward 90%, then the pathname/searchParams
 * effect — which only fires once navigation has committed — snaps it to 100%
 * and fades it out. Pairs with loading.tsx skeletons for full coverage.
 */
export function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = React.useState(0);
  const [active, setActive] = React.useState(false);
  const trickle = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const firstRender = React.useRef(true);

  const stopTrickle = () => {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  };

  const start = React.useCallback(() => {
    setActive(true);
    setProgress(8);
    stopTrickle();
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.08) : p));
    }, 180);
  }, []);

  // Begin on internal link clicks and history navigation.
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same URL → no navigation, don't flash the bar.
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      start();
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      stopTrickle();
    };
  }, [start]);

  // Complete once the route has actually changed.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stopTrickle();
    setProgress(100);
    const t = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: active ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
        style={{
          width: `${progress}%`,
          transition: "width 180ms ease",
        }}
      />
    </div>
  );
}
