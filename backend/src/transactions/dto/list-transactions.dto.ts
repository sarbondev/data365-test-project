import { Type as TransformType } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from '@prisma/client';

export class ListTransactionsDto {
  @IsOptional()
  @IsEnum(Type)
  type?: Type;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @TransformType(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @TransformType(() => Number)
  pageSize?: number = 20;
}
