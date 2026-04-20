import { Type as TransformType } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from '@prisma/client';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(Type)
  type?: Type;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @TransformType(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
