import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDemoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  storeName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  businessType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
