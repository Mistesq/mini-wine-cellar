import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  findAll(): Promise<User[]> {
    return this.em.find(User, {}, { orderBy: { name: "ASC" } });
  }

  findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }
}
