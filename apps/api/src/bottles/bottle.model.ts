import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

// The owner is left out on purpose: clients only ever see their own bottles.
@ObjectType("Bottle")
export class BottleModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  producer: string;

  @Field(() => Int)
  vintage: number;

  @Field()
  region: string;

  @Field(() => String, { nullable: true })
  photoUrl: string | null;

  @Field(() => Int)
  likesCount: number;

  @Field()
  createdAt: Date;
}
