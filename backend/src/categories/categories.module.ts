import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [AIModule],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
