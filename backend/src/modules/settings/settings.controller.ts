import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { UpdateBarcodeLabelSettingsDto } from "./dto/barcode-label-settings.dto";
import { ReceiptSettingsQueryDto, UpdateReceiptSettingsDto } from "./dto/receipt-settings.dto";
import { SettingsService } from "./settings.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @RequirePermissions("settings.receipt.view")
  @Get("receipt")
  getReceiptSettings(@CurrentUser() user: AuthenticatedUser, @Query() query: ReceiptSettingsQueryDto) {
    return this.settingsService.getReceiptSettings(user, query.branchId);
  }

  @RequirePermissions("settings.receipt.update")
  @Patch("receipt")
  updateReceiptSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateReceiptSettingsDto) {
    return this.settingsService.updateReceiptSettings(user, dto);
  }

  @RequirePermissions("printing.barcodes")
  @Get("barcode-labels")
  getBarcodeLabelSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getBarcodeLabelSettings(user);
  }

  @RequirePermissions("printing.barcodes")
  @Patch("barcode-labels")
  updateBarcodeLabelSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBarcodeLabelSettingsDto) {
    return this.settingsService.updateBarcodeLabelSettings(user, dto);
  }
}
