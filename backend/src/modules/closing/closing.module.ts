import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { ClosingController } from "./closing.controller";
import { ClosingService } from "./closing.service";

@Module({
  imports: [PrismaModule, AuthModule, ActivityLogsModule],
  controllers: [ClosingController],
  providers: [ClosingService],
})
export class ClosingModule {}
