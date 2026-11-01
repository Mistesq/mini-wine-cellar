import { join } from "node:path";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { BottlesModule } from "./bottles/bottles.module";
import { formatError } from "./graphql/format-error";
import config from "./mikro-orm.config";
import { UsersModule } from "./users/users.module";

const isProduction = process.env.NODE_ENV === "production";

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Production keeps the schema in memory, as its filesystem may be read-only. Elsewhere the
      // file feeds web Codegen; it resolves from the cwd, which is apps/api under `-w api` and `npm run dev`.
      autoSchemaFile: isProduction ? true : join(process.cwd(), "schema.gql"),
      sortSchema: true,
      // Also keeps the deprecated Apollo 4 playground plugin, bundled with @nestjs/apollo 13, unused.
      playground: false,
      // formatError does all the mapping; the driver's own pass would turn 404 into INTERNAL_SERVER_ERROR.
      autoTransformHttpErrors: false,
      includeStacktraceInErrorResponses: false,
      // Drops "Did you mean ...?" hints in production, where introspection is off; codes stay the same.
      hideSchemaDetailsFromClientErrors: isProduction,
      formatError,
    }),
    UsersModule,
    BottlesModule,
  ],
})
export class AppModule {}
