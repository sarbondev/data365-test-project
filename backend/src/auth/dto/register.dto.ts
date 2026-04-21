import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Locale } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsIn(['uz', 'ru'])
  locale?: Locale;
}
