"use client";

import { useQuery } from "@apollo/client/react";
import { BottleCard } from "@/components/bottle-card";
import { MY_BOTTLES_QUERY } from "@/graphql/bottles";
import { getErrorMessage } from "@/lib/graphql-errors";

export function BottleList() {
  const { data, loading, error } = useQuery(MY_BOTTLES_QUERY);

  if (loading && !data) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const errorMessage = error && (
    <p role="alert" className="text-destructive">
      {getErrorMessage(
        error,
        "Could not load your bottles. Check your connection and try again.",
      )}
    </p>
  );

  // Without data the error is the whole state; with cached data (a failed
  // refetch) it sits above the list so the bottles stay visible.
  if (!data) {
    return errorMessage;
  }

  if (data.myBottles.length === 0) {
    return (
      errorMessage || (
        <p className="text-muted-foreground">Your cellar is empty</p>
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {errorMessage}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.myBottles.map((bottle) => (
          <li key={bottle.id}>
            <BottleCard bottle={bottle} />
          </li>
        ))}
      </ul>
    </div>
  );
}
