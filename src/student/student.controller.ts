import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { StudentService } from './student.service';
import { StudentWarningsQueryDto } from './dto/student-warnings.dto';
import { StudentGradesQueryDto } from './dto/student-grades.dto';
import { StudentSnapshotsQueryDto } from './dto/student-snapshots.dto';
import { ProgressSummaryQueryDto } from 'src/student/dto/progress-summary.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ===== warnings inbox =====
  @Get('warnings')
  @ApiQuery({ name: 'semester_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listWarnings(@Req() req: any, @Query() dto: StudentWarningsQueryDto) {
    return this.studentService.listMyWarnings(req.user.userId, dto);
  }

  @Get('warnings/:id')
  async warningDetail(@Req() req: any, @Param('id') id: string) {
    return this.studentService.getMyWarningDetail(req.user.userId, id);
  }

  @Post('warnings/:id/acknowledge')
  async acknowledge(@Req() req: any, @Param('id') id: string) {
    return this.studentService.acknowledgeWarning(req.user.userId, id);
  }

  // ===== grades =====
  @Get('grades')
  @ApiQuery({ name: 'semester_id', required: false })
  async listGrades(@Req() req: any, @Query() dto: StudentGradesQueryDto) {
    return this.studentService.listMyGrades(req.user.userId, dto.semester_id);
  }

  // ===== gpa snapshots =====
  @Get('gpa-snapshots')
  async listSnapshots(@Req() req: any, @Query() dto: StudentSnapshotsQueryDto) {
    return this.studentService.listMySnapshots(req.user.userId, dto);
  }

  // ===== progress summary =====
  @Get('progress/summary')
  @ApiQuery({ name: 'semester_id', required: true })
  async progressSummary(@Req() req: any, @Query() dto: ProgressSummaryQueryDto) {
    return this.studentService.getProgressSummary(req.user.userId, dto.semester_id);
  }
}
