import { Type as TransformType } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsEnum(Type)
  type!: Type;

  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: 'color must be a valid hex (#RRGGBB)',
  })
  color!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @TransformType(() => Number)
  budget?: number;
}
