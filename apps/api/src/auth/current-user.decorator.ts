import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { User } from "../users/user.entity";
import type { GqlContext } from "./user-id.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const { user } =
      GqlExecutionContext.create(context).getContext<GqlContext>();
    if (!user) {
      throw new Error("@CurrentUser() needs UserIdGuard on the resolver");
    }
    return user;
  },
);
