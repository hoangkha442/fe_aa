import { Module } from '@nestjs/common';
import { WorklogService } from './worklog.service';
import { WorklogController } from './worklog.controller';

@Module({
  controllers: [WorklogController],
  providers: [WorklogService],
})
export class WorklogModule {}
