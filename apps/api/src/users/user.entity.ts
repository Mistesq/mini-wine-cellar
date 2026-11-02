import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
  @PrimaryKey({ type: "uuid" })
  id: string;

  @Property({ type: "text", unique: true })
  name: string;
}
