import { randomUUID } from "node:crypto";
import {
  Entity,
  Index,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { User } from "../users/user.entity";

// Serves myBottles. Ascending on purpose: Postgres scans a B-tree backwards,
// so ORDER BY created_at DESC, id DESC uses it without a DESC index.
@Index({ properties: ["owner", "createdAt", "id"] })
@Entity()
export class Bottle {
  [OptionalProps]?: "id" | "photoUrl" | "likesCount" | "createdAt";

  @PrimaryKey({ type: "uuid" })
  id: string = randomUUID();

  @ManyToOne(() => User)
  owner: User;

  @Property({ type: "text" })
  name: string;

  @Property({ type: "text" })
  producer: string;

  @Property({ type: "text" })
  region: string;

  @Property({ type: "integer" })
  vintage: number;

  @Property({ type: "text", nullable: true })
  photoUrl: string | null = null;

  @Property({ type: "integer", default: 0 })
  likesCount: number = 0;

  // No initializer: the database clock sets it, and the insert's RETURNING
  // hydrates it, so every API instance orders bottles by the same clock.
  @Property({ type: "timestamptz", defaultRaw: "now()" })
  createdAt: Date;
}
