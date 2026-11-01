import { raw } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Bottle } from "./bottle.entity";

export interface CreateBottleData {
  name: string;
  producer: string;
  region: string;
  vintage: number;
  photoUrl?: string;
}

@Injectable()
export class BottlesService {
  constructor(private readonly em: EntityManager) {}

  findForOwner(ownerId: string): Promise<Bottle[]> {
    return this.em.find(
      Bottle,
      { owner: ownerId },
      { orderBy: { createdAt: "DESC", id: "DESC" } },
    );
  }

  async create(ownerId: string, data: CreateBottleData): Promise<Bottle> {
    // Fields are picked one by one, so an owner hidden in the input can never win.
    const bottle = this.em.create(Bottle, {
      owner: ownerId,
      name: data.name,
      producer: data.producer,
      region: data.region,
      vintage: data.vintage,
      photoUrl: data.photoUrl ?? null,
    });
    await this.em.flush();
    return bottle;
  }

  async like(ownerId: string, id: string): Promise<Bottle> {
    // One conditional UPDATE: atomic, and a foreign bottle looks the same as a missing one.
    const affected = await this.em.nativeUpdate(
      Bottle,
      { id, owner: ownerId },
      { likesCount: raw("likes_count + 1") },
    );
    if (affected === 0) {
      throw new NotFoundException("Bottle not found");
    }
    // nativeUpdate skips the identity map, so reload the row from the database.
    return this.em.findOneOrFail(
      Bottle,
      { id, owner: ownerId },
      { refresh: true },
    );
  }
}
