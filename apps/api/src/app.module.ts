import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { BottlesModule } from "./bottles/bottles.module";
import config from "./mikro-orm.config";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [MikroOrmModule.forRoot(config), UsersModule, BottlesModule],
})
export class AppModule {}
