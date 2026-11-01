"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIKE_BOTTLE_MUTATION } from "@/graphql/bottles";
import { optimisticLike } from "@/lib/optimistic-like";

export function LikeButton({
  bottleId,
  bottleName,
  likesCount,
}: {
  bottleId: string;
  bottleName: string;
  likesCount: number;
}) {
  const client = useApolloClient();
  const [likeBottle, { error }] = useMutation(LIKE_BOTTLE_MUTATION);

  const like = () => {
    // A function, so the count is read from the cache when Apollo records this
    // optimistic layer, not from props that may lag behind earlier clicks.
    // Apollo drops the layer on error, which rolls the count back.
    likeBottle({
      variables: { id: bottleId },
      optimisticResponse: () =>
        optimisticLike(client.cache, bottleId, likesCount),
    }).catch(() => {
      // Shown below through the hook's error state.
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        className="h-11 self-start"
        aria-label={`Like ${bottleName}, ${likesCount} ${likesCount === 1 ? "like" : "likes"}`}
        onClick={like}
      >
        <HeartIcon className="text-primary" aria-hidden />
        {likesCount}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Could not save the like. Try again.
        </p>
      )}
    </div>
  );
}
