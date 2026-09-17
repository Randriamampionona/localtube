import { NextRequest, NextResponse } from "next/server";

const PIPED_INSTANCES = [
  "https://api.piped.privacydev.net",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
];

const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://invidious.drgns.space",
  "https://vid.puffyan.us",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("v");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Try Cobalt API (High reliability for raw stream extraction)
  try {
    const cobaltRes = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        videoQuality: "720",
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (cobaltRes.ok) {
      const data = await cobaltRes.json();
      if (data.url) {
        return NextResponse.json({ streamUrl: data.url });
      }
    }
  } catch {
    /* Fall through to next providers */
  }

  // 2. Try Piped API instances with 2.5s timeouts
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(2500),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const streamUrl = data.hls || data.videoStreams?.[0]?.url;

      if (streamUrl) {
        return NextResponse.json({ streamUrl });
      }
    } catch {
      continue;
    }
  }

  // 3. Try Invidious API instances as final fallback
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(2500),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const formatStreams = data.formatStreams || [];
      const mp4Stream = formatStreams.find(
        (s: { container: string; url: string }) => s.container === "mp4" && s.url
      );

      const streamUrl = data.hlsUrl || mp4Stream?.url || formatStreams[0]?.url;

      if (streamUrl) {
        return NextResponse.json({ streamUrl });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "Stream unavailable" }, { status: 404 });
}