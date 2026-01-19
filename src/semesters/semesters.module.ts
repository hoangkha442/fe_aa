import { Module } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { SemestersController } from './semesters.controller';

@Module({
  controllers: [SemestersController],
  providers: [SemestersService],
})
export class SemestersModule {}
