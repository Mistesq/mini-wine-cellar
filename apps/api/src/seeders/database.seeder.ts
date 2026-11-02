import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { Bottle } from "../bottles/bottle.entity";
import { User } from "../users/user.entity";
import { DEMO_BOTTLES } from "./demo-bottles";

const ANNA_ID = "00000000-0000-4000-8000-000000000001";

// Fixed ids keep the user stored in the browser valid across reseeds.
const SEED_USERS = [
  { id: ANNA_ID, name: "Anna" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Mark" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Taras" },
];

export class DatabaseSeeder extends Seeder {
  override async run(em: EntityManager): Promise<void> {
    await em.upsertMany(User, SEED_USERS);
    // Only Anna gets demo bottles; Mark and Taras show the empty state.
    // Merge on id resets every demo field, likes included, to one canonical
    // demo state (D-29); rows added through the UI have other ids and stay.
    await em.upsertMany(
      Bottle,
      DEMO_BOTTLES.map((bottle) => ({ ...bottle, owner: ANNA_ID })),
      { onConflictFields: ["id"], onConflictAction: "merge" },
    );
  }
}
