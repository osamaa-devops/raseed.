import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identity!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
