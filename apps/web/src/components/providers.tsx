"use client";

import { ApolloProvider } from "@apollo/client/react";
import { type ReactNode, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { createApolloClient } from "@/lib/apollo-client";
import { subscribeToCurrentUser } from "@/lib/current-user-store";

export function Providers({ children }: { children: ReactNode }) {
  // useState, not a module singleton: on the server a shared client would leak
  // one render's cache into the next.
  const [client] = useState(createApolloClient);

  // The one place a user switch drops the previous user's cache, whichever tab
  // made it. resetStore, not clearStore: both cancel in-flight queries (not
  // mutations, D-33), but only resetStore refetches the mounted queries with
  // the new x-user-id.
  useEffect(
    () =>
      subscribeToCurrentUser(() => {
        // A failed refetch already shows up as that query's error state.
        client.resetStore().catch(() => {});
      }),
    [client],
  );

  return (
    <ApolloProvider client={client}>
      {children}
      <Toaster />
    </ApolloProvider>
  );
}
