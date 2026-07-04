import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { AdminStoresController, StoresController } from "./stores.controller";
import { StoresService } from "./stores.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [StoresController, AdminStoresController],
  providers: [StoresService],
})
export class StoresModule {}
