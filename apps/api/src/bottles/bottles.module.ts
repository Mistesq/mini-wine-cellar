import { Module } from "@nestjs/common";
import { BottlesService } from "./bottles.service";

@Module({
  providers: [BottlesService],
})
export class BottlesModule {}
