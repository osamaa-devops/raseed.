import { IsString, MinLength } from "class-validator";

export class LicenseActivateDto {
  @IsString()
  @MinLength(20)
  key!: string;
}
