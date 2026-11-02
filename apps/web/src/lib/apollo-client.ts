import { ApolloClient, ApolloLink, HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { resolveApiUrl } from "./api-url";
import { createApolloCache } from "./apollo-cache";
import { getCurrentUserId } from "./current-user-store";

// Module scope on purpose: `next build` prerenders `/`, so a production build
// without NEXT_PUBLIC_API_URL fails here instead of shipping a localhost url.
const API_URL = resolveApiUrl(
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NODE_ENV,
);

// Read at request time, so a user switch applies to the next request without
// rebuilding the client.
const userIdLink = new SetContextLink((prevContext) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return {};
  }
  return { headers: { ...prevContext.headers, "x-user-id": userId } };
});

export function createApolloClient(): ApolloClient {
  return new ApolloClient({
    cache: createApolloCache(),
    link: ApolloLink.from([userIdLink, new HttpLink({ uri: API_URL })]),
  });
}
