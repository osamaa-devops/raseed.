import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [PrismaModule, AuthModule, ActivityLogsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
