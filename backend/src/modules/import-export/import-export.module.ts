import { Module } from "@nestjs/common";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { AuthModule } from "../auth/auth.module";
import { ImportExportController } from "./import-export.controller";
import { ImportExportService } from "./import-export.service";

@Module({
  imports: [AuthModule, ActivityLogsModule],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
