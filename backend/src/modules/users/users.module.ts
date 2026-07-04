import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
