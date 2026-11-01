import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // The committed schema file, not the running server, so codegen and typecheck work offline.
  schema: "../api/schema.gql",
  documents: ["src/**/*.{ts,tsx}", "!src/gql/**/*"],
  generates: {
    "./src/gql/": {
      preset: "client",
      config: {
        useTypeImports: true,
        // Apollo adds __typename to every selection at runtime; typing it lets an
        // optimisticResponse carry the __typename the cache needs to find the entity.
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        // DateTime arrives over JSON as an ISO string.
        scalars: { DateTime: "string" },
      },
    },
  },
};

export default config;
