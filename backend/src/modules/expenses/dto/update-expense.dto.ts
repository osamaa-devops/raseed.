import { ExpenseCategory } from "@prisma/client";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  attachmentUrl?: string | null;
}
