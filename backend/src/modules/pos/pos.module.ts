import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { PosController } from "./pos.controller";
import { PosService } from "./pos.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
