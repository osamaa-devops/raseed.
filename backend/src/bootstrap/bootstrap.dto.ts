import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class BootstrapSetupDto {
  @IsString()
  @MaxLength(180)
  shopName!: string;

  @IsString()
  @MaxLength(40)
  shopPhone!: string;

  @IsString()
  @MaxLength(250)
  shopAddress!: string;

  @IsString()
  @MaxLength(500)
  receiptFooter!: string;

  @IsString()
  @MaxLength(180)
  ownerName!: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsString()
  @MaxLength(40)
  ownerPhone!: string;

  @IsString()
  @MinLength(8)
  ownerPassword!: string;
}
