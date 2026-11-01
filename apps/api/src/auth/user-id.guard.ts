import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { isUUID } from "class-validator";
import type { Request } from "express";
import type { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";

export interface GqlContext {
  req: Request;
  user?: User;
}

// The only place that knows how a user is identified: swapping the fake header
// for a real identity provider replaces this guard and nothing else.
@Injectable()
export class UserIdGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext<GqlContext>();
    const userId = ctx.req.headers["x-user-id"];
    // A non-uuid never reaches the database, where the uuid column would reject it.
    const user =
      typeof userId === "string" && isUUID(userId)
        ? await this.users.findById(userId)
        : null;
    if (!user) {
      throw new UnauthorizedException("A valid x-user-id header is required");
    }
    ctx.user = user;
    return true;
  }
}
