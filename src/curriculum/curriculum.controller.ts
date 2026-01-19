import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { CurriculumService } from './curriculum.service';
import { BulkCurriculumDto } from './dto/bulk-curriculum.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/curriculum')
export class CurriculumController {
  constructor(private readonly svc: CurriculumService) {}

  @Post('bulk')
  bulkUpsert(@Body() dto: BulkCurriculumDto) {
    return this.svc.bulkUpsert(dto);
  }

  @Get('classes/:class_id')
  @ApiQuery({ name: 'semester_no', required: false, type: Number })
  listByClass(@Param('class_id') classId: string, @Query('semester_no') semNo?: string) {
    return this.svc.listByClass(classId, semNo ? Number(semNo) : undefined);
  }
}
