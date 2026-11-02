import { InMemoryCache } from "@apollo/client";

export function createApolloCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Bottle: {
        fields: {
          likesCount: {
            // A like only adds one (no unlike), so the count never goes down. Each
            // response carries an absolute count, and one that arrives out of
            // order would otherwise overwrite a newer, higher count (D-34).
            merge: (existing: number | undefined, incoming: number) =>
              existing === undefined ? incoming : Math.max(existing, incoming),
          },
        },
      },
    },
  });
}
