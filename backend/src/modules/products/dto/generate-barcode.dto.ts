import { IsBoolean, IsOptional } from "class-validator";

export class GenerateBarcodeDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
