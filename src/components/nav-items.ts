import { Home, Bookmark, ListVideo, type LucideIcon } from "lucide-react";

/** Single source of truth for primary nav, used by the sidebar + mobile drawer. */
export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
];
