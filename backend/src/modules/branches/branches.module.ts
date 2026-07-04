import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
