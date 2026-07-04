import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
