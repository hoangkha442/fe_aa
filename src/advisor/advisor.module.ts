import { Module } from '@nestjs/common';
import { AdvisorController } from './advisor.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AdvisorService } from 'src/advisor/addvisor.service';

@Module({
  controllers: [AdvisorController],
  providers: [AdvisorService, PrismaService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
