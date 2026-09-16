const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1200000 → "1.2M" */
export function formatCount(n?: number): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return compact.format(n);
}

/** ISO date → "3 days ago" */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secsInUnit] of units) {
    if (secs >= secsInUnit) return rtf.format(-Math.floor(secs / secsInUnit), unit);
  }
  return rtf.format(-secs, "second");
}

/** "PT4M13S" → "4:13" */
export function formatDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [, h, min, s] = m.map((x) => (x ? Number(x) : 0));
  const mm = h ? String(min).padStart(2, "0") : String(min);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
