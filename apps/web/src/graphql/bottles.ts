import { graphql } from "@/gql";

// addBottle selects the same fields as myBottles, so the result can be
// prepended to the cached list as is.
export const MY_BOTTLES_QUERY = graphql(`
  query MyBottles {
    myBottles {
      id
      name
      producer
      vintage
      region
      photoUrl
      likesCount
    }
  }
`);

export const ADD_BOTTLE_MUTATION = graphql(`
  mutation AddBottle($input: AddBottleInput!) {
    addBottle(input: $input) {
      id
      name
      producer
      vintage
      region
      photoUrl
      likesCount
    }
  }
`);

// Read from the cache to build the optimistic like from the latest count.
export const BOTTLE_LIKES_FRAGMENT = graphql(`
  fragment BottleLikes on Bottle {
    likesCount
  }
`);

export const LIKE_BOTTLE_MUTATION = graphql(`
  mutation LikeBottle($id: ID!) {
    likeBottle(id: $id) {
      id
      likesCount
    }
  }
`);
