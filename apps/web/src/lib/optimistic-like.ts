import type { ApolloCache } from "@apollo/client";
import type { LikeBottleMutation } from "@/gql/graphql";
import { BOTTLE_LIKES_FRAGMENT } from "@/graphql/bottles";

// Reads the count with optimistic layers applied, so each click builds on the
// previous click's optimistic value even when several land before a re-render.
export function optimisticLike(
  cache: ApolloCache,
  bottleId: string,
  fallbackCount: number,
): LikeBottleMutation {
  const current = cache.readFragment({
    id: cache.identify({ __typename: "Bottle", id: bottleId }),
    fragment: BOTTLE_LIKES_FRAGMENT,
    optimistic: true,
  });
  return {
    likeBottle: {
      __typename: "Bottle",
      id: bottleId,
      likesCount: (current?.likesCount ?? fallbackCount) + 1,
    },
  };
}
