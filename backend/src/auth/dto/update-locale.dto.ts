import { IsIn } from 'class-validator';
import { Locale } from '@prisma/client';

export class UpdateLocaleDto {
  @IsIn(['uz', 'ru'])
  locale!: Locale;
}
