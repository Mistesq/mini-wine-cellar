import { ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "../auth/current-user.decorator";
import { UserIdGuard } from "../auth/user-id.guard";
import type { User } from "../users/user.entity";
import { AddBottleInput } from "./add-bottle.input";
import type { Bottle } from "./bottle.entity";
import { BottleModel } from "./bottle.model";
import { BottlesService } from "./bottles.service";

@Resolver(() => BottleModel)
@UseGuards(UserIdGuard)
export class BottlesResolver {
  constructor(private readonly bottles: BottlesService) {}

  @Query(() => [BottleModel])
  myBottles(@CurrentUser() user: User): Promise<Bottle[]> {
    return this.bottles.findForOwner(user.id);
  }

  @Mutation(() => BottleModel)
  addBottle(
    @CurrentUser() user: User,
    @Args("input") input: AddBottleInput,
  ): Promise<Bottle> {
    return this.bottles.create(user.id, input);
  }

  @Mutation(() => BottleModel)
  likeBottle(
    @CurrentUser() user: User,
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Bottle> {
    return this.bottles.like(user.id, id);
  }
}
