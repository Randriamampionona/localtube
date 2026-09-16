"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toggleFavorite, type SavedVideo } from "@/server/library";

export function FavoriteButton({
  video,
  initialSaved,
}: {
  video: SavedVideo;
  initialSaved: boolean;
}) {
  const { isSignedIn } = useAuth();
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!isSignedIn) {
      // Send guests to sign-in; Clerk's <SignInButton> in the header also works.
      window.location.href = "/sign-in";
      return;
    }
    // Optimistic flip, reconciled with the server result.
    setSaved((s) => !s);
    startTransition(async () => {
      const result = await toggleFavorite(video);
      setSaved(result);
    });
  }

  return (
    <Button
      variant={saved ? "default" : "secondary"}
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
