import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { StoresController } from "./stores.controller";
import { StoresService } from "./stores.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}
