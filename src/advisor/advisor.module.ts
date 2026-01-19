import { Module } from '@nestjs/common';
import { AdvisorService } from 'src/advisor/addvisor.service';
import { AdvisorController } from 'src/advisor/advisor.controller';



@Module({
  controllers: [AdvisorController],
  providers: [AdvisorService],
})
export class AdvisorModule {}
