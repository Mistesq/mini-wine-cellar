import { InMemoryCache } from "@apollo/client";
import { BOTTLE_LIKES_FRAGMENT } from "@/graphql/bottles";
import { optimisticLike } from "./optimistic-like";

describe("optimisticLike", () => {
  it("stacks on the latest optimistic count, falling back to props when uncached", () => {
    const cache = new InMemoryCache();
    const id = cache.identify({ __typename: "Bottle", id: "b1" });
    cache.writeFragment({
      id,
      fragment: BOTTLE_LIKES_FRAGMENT,
      data: { __typename: "Bottle", likesCount: 3 },
    });

    const first = optimisticLike(cache, "b1", 3);
    // What Apollo does with the response before the next click lands.
    cache.recordOptimisticTransaction((proxy) => {
      proxy.writeFragment({
        id,
        fragment: BOTTLE_LIKES_FRAGMENT,
        data: { __typename: "Bottle", likesCount: first.likeBottle.likesCount },
      });
    }, "like-1");

    expect(first.likeBottle).toEqual({
      __typename: "Bottle",
      id: "b1",
      likesCount: 4,
    });
    // The same stale prop (3), but the cache already holds the optimistic 4.
    expect(optimisticLike(cache, "b1", 3).likeBottle.likesCount).toBe(5);
    expect(optimisticLike(cache, "missing", 7).likeBottle.likesCount).toBe(8);
  });
});
