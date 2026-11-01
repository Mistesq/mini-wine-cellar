import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType("User")
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
