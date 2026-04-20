import { Type as TransformType } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: 'color must be a valid hex (#RRGGBB)',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @TransformType(() => Number)
  budget?: number | null;
}
