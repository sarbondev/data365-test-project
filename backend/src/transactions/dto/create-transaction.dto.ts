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
import { Source, Type } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(Type)
  type!: Type;

  @IsNumber()
  @IsPositive()
  @TransformType(() => Number)
  amount!: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(Source)
  source?: Source;
}
