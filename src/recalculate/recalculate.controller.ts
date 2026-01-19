import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RecalculateService } from './recalculate.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/recalculate')
export class RecalculateController {
  constructor(private readonly svc: RecalculateService) {}

  @Post('gpa')
  recalcGpa(@Body() body: { scope: 'semester'|'class'|'student', semester_id?: string, class_id?: string, student_id?: string }) {
    return this.svc.recalcGpa(body);
  }
}
