"use client";

import { useQuery } from "@apollo/client/react";
import { useCurrentUserId } from "@/lib/current-user-store";
import { USERS_QUERY } from "@/lib/users-query";

export function Cellar() {
  const userId = useCurrentUserId();
  const { data, loading, error } = useQuery(USERS_QUERY);
  const user = data?.users.find((candidate) => candidate.id === userId);

  if (userId && loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (userId && error) {
    return (
      <p className="text-muted-foreground">
        The cellar is unavailable right now. Try again later.
      </p>
    );
  }

  if (!user) {
    return (
      <p className="text-muted-foreground">Choose a user to open the cellar</p>
    );
  }

  return <h1 className="text-2xl font-semibold">{user.name}&apos;s cellar</h1>;
}
