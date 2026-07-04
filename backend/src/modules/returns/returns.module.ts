import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { ReturnsController } from "./returns.controller";
import { ReturnsService } from "./returns.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
