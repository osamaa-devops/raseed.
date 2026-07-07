import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminDemoRequestsController } from "./admin-demo-requests.controller";
import { DemoRequestsService } from "./demo-requests.service";
import { PublicDemoRequestsController } from "./public-demo-requests.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PublicDemoRequestsController, AdminDemoRequestsController],
  providers: [DemoRequestsService],
})
export class DemoRequestsModule {}
