"use client";

import { WineIcon } from "lucide-react";
import { useState } from "react";
import { LikeButton } from "@/components/like-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MyBottlesQuery } from "@/gql/graphql";

type Bottle = MyBottlesQuery["myBottles"][number];

export function BottleCard({ bottle }: { bottle: Bottle }) {
  return (
    <Card className="h-full pt-0">
      <BottlePhoto url={bottle.photoUrl} name={bottle.name} />
      <CardHeader>
        <CardTitle className="break-words">{bottle.name}</CardTitle>
        <CardDescription className="break-words">
          {bottle.producer}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 break-words text-muted-foreground">
        {bottle.vintage} · {bottle.region}
      </CardContent>
      <CardFooter>
        <LikeButton
          bottleId={bottle.id}
          bottleName={bottle.name}
          likesCount={bottle.likesCount}
        />
      </CardFooter>
    </Card>
  );
}

function BottlePhoto({
  url,
  name,
}: {
  url: string | null | undefined;
  name: string;
}) {
  // Keyed by url, so a new url after a failed one gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-muted-foreground">
        <WineIcon className="size-10" aria-hidden />
        <span className="sr-only">No photo</span>
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: photos come from arbitrary domains
    <img
      src={url}
      alt={name}
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
      onError={() => setFailedUrl(url)}
    />
  );
}
