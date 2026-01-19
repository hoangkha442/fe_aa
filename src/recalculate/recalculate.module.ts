import { Module } from '@nestjs/common';
import { RecalculateService } from './recalculate.service';
import { RecalculateController } from './recalculate.controller';

@Module({
  controllers: [RecalculateController],
  providers: [RecalculateService],
})
export class RecalculateModule {}
