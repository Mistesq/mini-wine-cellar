import { Query, Resolver } from "@nestjs/graphql";
import type { User } from "./user.entity";
import { UserModel } from "./user.model";
import { UsersService } from "./users.service";

// Public on purpose: the user dropdown loads before anyone is "logged in".
@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel])
  users(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
