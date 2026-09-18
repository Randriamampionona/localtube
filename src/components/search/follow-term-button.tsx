"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toggleFollowTerm } from "@/server/terms";

export function FollowTermButton({
  term,
  initialFollowed,
}: {
  term: string;
  initialFollowed: boolean;
}) {
  const { isSignedIn } = useAuth();
  const [followed, setFollowed] = React.useState(initialFollowed);
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }
    setFollowed((f) => !f); // optimistic
    startTransition(async () => {
      const result = await toggleFollowTerm(term);
      setFollowed(result);
    });
  }

  return (
    <Button
      variant={followed ? "default" : "secondary"}
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-pressed={followed}
    >
      {followed ? <Check className="size-4" /> : <Plus className="size-4" />}
      {followed ? "Following" : "Follow term"}
    </Button>
  );
}
