"use client";

import { useQuery } from "@apollo/client/react";
import { AddBottleForm } from "@/components/add-bottle-form";
import { BottleList } from "@/components/bottle-list";
import { USERS_QUERY } from "@/graphql/users";
import { useCurrentUserId } from "@/lib/current-user-store";

export function Cellar() {
  const userId = useCurrentUserId();
  const { data, error } = useQuery(USERS_QUERY);
  const user = data?.users.find((candidate) => candidate.id === userId);

  if (!userId || (data && !user)) {
    return (
      <p className="text-muted-foreground">Choose a user to open the cellar</p>
    );
  }

  if (!data && error) {
    return (
      <p className="text-muted-foreground">
        The cellar is unavailable right now. Try again later.
      </p>
    );
  }

  // Not gated on the users query: a user switch resets the store and refetches
  // it, and unmounting here would drop the form input and refetch the list twice.
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {user ? `${user.name}'s cellar` : "Your cellar"}
      </h1>
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <section aria-label="Add a bottle" className="lg:sticky lg:top-6">
          {/* Keyed so a user switch drops the previous user's input and errors. */}
          <AddBottleForm key={userId} />
        </section>
        <section aria-label="My bottles">
          <BottleList />
        </section>
      </div>
    </div>
  );
}
