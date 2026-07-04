import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateStoreDto {
  @IsString()
  name!: string;

  @IsString()
  ownerName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
