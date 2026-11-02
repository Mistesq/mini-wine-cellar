import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { Subject } from "rxjs";
import { BOTTLE_LIKES_FRAGMENT, LIKE_BOTTLE_MUTATION } from "@/graphql/bottles";
import { createApolloCache } from "./apollo-cache";
import { optimisticLike } from "./optimistic-like";

const BOTTLE_ID = "b1";

// A client whose link answers only when the test says so, so responses can
// arrive in any order, or fail, without a network.
function setup(cache: InMemoryCache) {
  const responses: Subject<ApolloLink.Result>[] = [];
  const client = new ApolloClient({
    cache,
    link: new ApolloLink(() => {
      const response = new Subject<ApolloLink.Result>();
      responses.push(response);
      return response;
    }),
  });
  const id = cache.identify({ __typename: "Bottle", id: BOTTLE_ID });
  cache.writeFragment({
    id,
    fragment: BOTTLE_LIKES_FRAGMENT,
    data: { __typename: "Bottle", likesCount: 3 },
  });

  const like = () =>
    client.mutate({
      mutation: LIKE_BOTTLE_MUTATION,
      variables: { id: BOTTLE_ID },
      optimisticResponse: () => optimisticLike(cache, BOTTLE_ID, 3),
    });
  const respond = (index: number, likesCount: number) => {
    responses[index].next({
      data: { likeBottle: { __typename: "Bottle", id: BOTTLE_ID, likesCount } },
    });
    responses[index].complete();
  };
  const fail = (index: number) => {
    responses[index].error(new Error("Failed to fetch"));
  };
  const count = (optimistic: boolean) =>
    cache.readFragment({ id, fragment: BOTTLE_LIKES_FRAGMENT, optimistic })
      ?.likesCount;
  const requestsSent = async (n: number) => {
    while (responses.length < n) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  return { like, respond, fail, count, requestsSent };
}

// Two quick clicks; the server answers 4 and 5, but 5 arrives first.
async function likeTwiceOutOfOrder(cache: InMemoryCache) {
  const { like, respond, count, requestsSent } = setup(cache);
  const first = like();
  const second = like();
  await requestsSent(2);
  expect(count(true)).toBe(5);

  respond(1, 5);
  await second;
  respond(0, 4);
  await first;
  return { optimistic: count(true), stored: count(false) };
}

describe("createApolloCache", () => {
  it("keeps the higher like count when responses arrive out of order", async () => {
    expect(await likeTwiceOutOfOrder(createApolloCache())).toEqual({
      optimistic: 5,
      stored: 5,
    });
  });

  it("fixes what a plain cache gets wrong in the same race", async () => {
    // Guards the test above: without the merge policy the late 4 wins.
    expect((await likeTwiceOutOfOrder(new InMemoryCache())).stored).toBe(4);
  });

  it("rolls the optimistic like back when the request fails", async () => {
    const { like, fail, count, requestsSent } = setup(createApolloCache());
    const result = like();
    await requestsSent(1);
    expect(count(true)).toBe(4);

    fail(0);
    await expect(result).rejects.toThrow("Failed to fetch");
    expect(count(true)).toBe(3);
    expect(count(false)).toBe(3);
  });
});
