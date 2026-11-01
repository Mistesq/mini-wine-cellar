import { graphql } from "@/gql";

// Shared by the header picker and the page; Apollo dedupes the request.
export const USERS_QUERY = graphql(`
  query Users {
    users {
      id
      name
    }
  }
`);
