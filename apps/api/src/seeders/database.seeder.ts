import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { User } from "../users/user.entity";

// Fixed ids keep the user stored in the browser valid across reseeds.
const SEED_USERS = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Anna" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Mark" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Taras" },
];

export class DatabaseSeeder extends Seeder {
  override async run(em: EntityManager): Promise<void> {
    await em.upsertMany(User, SEED_USERS);
  }
}
