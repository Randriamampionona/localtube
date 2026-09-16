"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function DescriptionToggle({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  if (!text) return null;

  return (
    <div className="mt-2">
      <p
        className={cn(
          "whitespace-pre-wrap text-muted-foreground",
          !open && "line-clamp-3",
        )}
      >
        {text}
      </p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-1 text-sm font-medium text-foreground hover:text-primary"
      >
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
