import { IsOptional, IsString } from "class-validator";

export class BackupSettingsDto {
  @IsOptional()
  @IsString()
  backupDir?: string;
}
