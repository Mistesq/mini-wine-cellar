import { existsSync } from "node:fs";
import { join } from "node:path";
import { ReflectMetadataProvider } from "@mikro-orm/core";
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";
import { Bottle } from "./bottles/bottle.entity";
import { User } from "./users/user.entity";

// Resolved from this file (src/ or dist/), so the Nest app and the CLI find
// apps/api/.env whatever the cwd. A missing file is fine: env may come from the shell.
const envFile = join(__dirname, "..", ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// The fallback matches the docker-compose defaults, so the local run flow needs
// no .env. Production must say where its database is (D-18).
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) {
    return url;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set when NODE_ENV is production");
  }
  return "postgresql://wine:wine@localhost:5432/wine_cellar";
}

export default defineConfig({
  clientUrl: resolveDatabaseUrl(),
  entities: [User, Bottle],
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: "dist/migrations",
    pathTs: "src/migrations",
    // The default name embeds the database name, which differs per DATABASE_URL.
    snapshotName: ".snapshot",
  },
  seeder: {
    path: "dist/seeders",
    pathTs: "src/seeders",
    // The default glob imports every file in the folder, specs included,
    // and a spec's `describe` crashes the seeder outside Jest.
    glob: "*.seeder.{js,ts}",
  },
});
