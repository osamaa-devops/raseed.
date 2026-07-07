import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { BackupSettingsDto } from "./dto/backup-settings.dto";
import { LicenseActivateDto } from "./dto/license-activate.dto";
import { SystemService } from "./system.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("system")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Public()
  @Get("license")
  getLicenseStatus() {
    return this.systemService.getLicenseStatus();
  }

  @Public()
  @Post("license/activate")
  activateLicense(@Body() dto: LicenseActivateDto) {
    return this.systemService.activateLicense(dto);
  }

  @RequirePermissions("backup.manage")
  @Get("backup")
  getBackupStatus() {
    return this.systemService.getBackupStatus();
  }

  @RequirePermissions("backup.manage")
  @Patch("backup")
  updateBackupSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: BackupSettingsDto) {
    return this.systemService.updateBackupSettings(user, dto);
  }

  @RequirePermissions("backup.manage")
  @Post("backup")
  createBackup(@CurrentUser() user: AuthenticatedUser) {
    return this.systemService.createBackup(user);
  }

  @RequirePermissions("backup.manage")
  @Post("backup/restore")
  restoreBackup(@CurrentUser() user: AuthenticatedUser, @Body() body: { backupPath: string }) {
    return this.systemService.restoreBackup(user, body.backupPath);
  }
}
