import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { BottlesResolver } from "./bottles.resolver";
import { BottlesService } from "./bottles.service";

@Module({
  // UserIdGuard on the resolver needs UsersService.
  imports: [UsersModule],
  providers: [BottlesService, BottlesResolver],
})
export class BottlesModule {}
