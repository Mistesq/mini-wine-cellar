import { Migration } from "@mikro-orm/migrations";

export class Migration20261101130640 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "user" ("id" uuid not null, "name" text not null, constraint "user_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "user" add constraint "user_name_unique" unique ("name");`,
    );

    this.addSql(
      `create table "bottle" ("id" uuid not null, "owner_id" uuid not null, "name" text not null, "producer" text not null, "region" text not null, "vintage" int not null, "photo_url" text null, "likes_count" int not null default 0, "created_at" timestamptz not null default now(), constraint "bottle_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bottle_owner_id_created_at_id_index" on "bottle" ("owner_id", "created_at", "id");`,
    );

    this.addSql(
      `alter table "bottle" add constraint "bottle_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;`,
    );
  }

  // Written by hand: `migration:create --initial` emits no down. bottle goes
  // first because its foreign key references user.
  override async down(): Promise<void> {
    this.addSql(`drop table if exists "bottle";`);
    this.addSql(`drop table if exists "user";`);
  }
}
