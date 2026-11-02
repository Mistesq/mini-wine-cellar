"use client";

import { useQuery } from "@apollo/client/react";
import { useRef } from "react";
import { BottleCard } from "@/components/bottle-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MyBottlesQuery } from "@/gql/graphql";
import { MY_BOTTLES_QUERY } from "@/graphql/bottles";
import { getErrorMessage } from "@/lib/graphql-errors";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
const SKELETON_KEYS = [1, 2, 3];

type Bottle = MyBottlesQuery["myBottles"][number];

export function BottleList() {
  const { data, loading, error, refetch } = useQuery(MY_BOTTLES_QUERY);
  const listRef = useRef<HTMLDivElement>(null);

  const retry = () => {
    // Without cached data the skeletons replace the button, so focus would
    // fall to <body>; once the retry settles it moves to the list area instead.
    refetch()
      .catch(() => {
        // A failed retry shows up again as this query's error state.
      })
      .finally(() => listRef.current?.focus());
  };

  return (
    <div ref={listRef} tabIndex={-1} className="outline-none">
      {/* Always mounted, only its text changes: screen readers announce a
          change in an existing live region, not a region that mounts with text. */}
      <output aria-live="polite" className="sr-only">
        {loading ? "Loading your bottles..." : ""}
      </output>
      <BottleListContent
        bottles={data?.myBottles}
        loading={loading}
        error={error}
        onRetry={retry}
      />
    </div>
  );
}

function BottleListContent({
  bottles,
  loading,
  error,
  onRetry,
}: {
  bottles: Bottle[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  // Apollo 4 reports loading during a refetch too, so a retry without cached
  // data shows the skeletons again and the button below never double-fires.
  if (loading && !bottles) {
    return <BottleListSkeleton />;
  }

  const errorMessage = error ? (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="text-destructive">
        {getErrorMessage(
          error,
          "Could not load your bottles. Check your connection and try again.",
        )}
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={loading}
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  ) : null;

  // Without data the error is the whole state; with cached data (a failed
  // refetch) it sits above the list so the bottles stay visible.
  if (!bottles) {
    return errorMessage;
  }

  if (bottles.length === 0) {
    return (
      errorMessage || (
        <p className="text-muted-foreground">Your cellar is empty</p>
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {errorMessage}
      <ul className={GRID}>
        {bottles.map((bottle) => (
          <li key={bottle.id}>
            <BottleCard bottle={bottle} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BottleListSkeleton() {
  return (
    <ul className={GRID} aria-hidden>
      {SKELETON_KEYS.map((key) => (
        <li key={key}>
          <Card className="h-full pt-0">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-5 w-12 rounded-4xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-11 w-20" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
