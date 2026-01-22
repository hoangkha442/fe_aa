import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';


import { GetAdvisorClassesDto } from './dto/get-advisor-classes.dto';
import { GetAdvisorDashboardDto } from './dto/get-advisor-dashboard.dto';
import { PreviewWarningsDto } from './dto/preview-warnings.dto';
import { GenerateWarningsDto } from './dto/generate-warnings.dto';
import { SendWarningsDto } from './dto/send-warnings.dto';
import { UpdateWarningStatusDto } from './dto/update-warning-status.dto';
import { BulkWarningStatusDto } from './dto/bulk-warning-status.dto';
import { CreateAdvisoryNoteDto } from './dto/create-advisory-note.dto';
import { UpdateAdvisoryNoteDto } from './dto/update-advisory-note.dto';
import { GetAdvisorStudentDetailDto } from './dto/get-advisor-student-detail.dto';
import { AdvisorService } from 'src/advisor/addvisor.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('advisor')
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  // ========== CLASSES ==========
  @Get('classes')
  @Roles('ADVISOR', 'ADMIN')
  async myClasses(@Req() req: any, @Query() dto: GetAdvisorClassesDto) {
    return this.advisorService.listMyClasses(req.user.userId, dto);
  }

  // ========== SEMESTERS ==========
  @Get('semesters')
  @Roles('ADVISOR', 'ADMIN')
  async listSemesters() {
    return this.advisorService.listSemesters();
  }

  // ========== DASHBOARD ==========
  @Get('dashboard')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'class_id', required: true, type: String })
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async classDashboard(@Req() req: any, @Query() dto: GetAdvisorDashboardDto) {
    return this.advisorService.getClassDashboard(req.user.userId, dto);
  }

  // ========== WARNING RULES ==========
  @Get('warning-rules')
  @Roles('ADVISOR', 'ADMIN')
  async listWarningRules() {
    return this.advisorService.listActiveWarningRules();
  }

  // ========== WARNINGS ==========
  @Get('warnings')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'class_id', required: true, type: String })
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listWarnings(
    @Req() req: any,
    @Query('class_id') classId: string,
    @Query('semester_id') semesterId?: string,
    @Query('status') status?: string,
    @Query('page') page?: any,
    @Query('limit') limit?: any,
  ) {
    return this.advisorService.listWarnings(
      req.user.userId,
      classId,
      semesterId,
      status,
      page,
      limit,
    );
  }

  @Get('warnings/preview')
  @Roles('ADVISOR', 'ADMIN')
  async previewWarnings(@Req() req: any, @Query() dto: PreviewWarningsDto) {
    return this.advisorService.previewWarnings(req.user.userId, dto);
  }

  @Post('warnings/generate')
  @Roles('ADVISOR', 'ADMIN')
  @ApiBody({ type: GenerateWarningsDto })
  async generateWarnings(@Req() req: any, @Body() dto: GenerateWarningsDto) {
    return this.advisorService.generateWarnings(req.user.userId, dto);
  }

  @Post('warnings/send')
  @Roles('ADVISOR', 'ADMIN')
  @ApiBody({ type: SendWarningsDto })
  async sendWarnings(@Req() req: any, @Body() dto: SendWarningsDto) {
    return this.advisorService.sendWarnings(req.user.userId, dto);
  }

  @Patch('warnings/:id/status')
  @Roles('ADVISOR', 'ADMIN')
  async updateWarningStatus(
    @Req() req: any,
    @Param('id') warningId: string,
    @Body() dto: UpdateWarningStatusDto,
  ) {
    return this.advisorService.updateWarningStatus(req.user.userId, warningId, dto);
  }

  @Patch('warnings/bulk-status')
  @Roles('ADVISOR', 'ADMIN')
  @ApiBody({ type: BulkWarningStatusDto })
  async bulkWarningStatus(@Req() req: any, @Body() dto: BulkWarningStatusDto) {
    return this.advisorService.bulkUpdateWarningStatus(req.user.userId, dto);
  }

  @Get('warnings/:id')
  @Roles('ADVISOR', 'ADMIN')
  async warningDetail(@Req() req: any, @Param('id') warningId: string) {
    return this.advisorService.getWarningDetail(req.user.userId, warningId);
  }

  // ========== STUDENTS ==========
  @Get('students/:id')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  @ApiQuery({ name: 'include_grades', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'include_notes_all', required: false, type: Boolean, example: false })
  async studentDetail(
    @Req() req: any,
    @Param('id') studentId: string,
    @Query() dto: GetAdvisorStudentDetailDto,
  ) {
    return this.advisorService.getStudentDetail(req.user.userId, studentId, dto);
  }

  @Get('students/:id/timeline')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  async studentTimeline(
    @Req() req: any,
    @Param('id') studentId: string,
    @Query('semester_id') semesterId?: string,
  ) {
    return this.advisorService.getStudentTimeline(req.user.userId, studentId, semesterId);
  }

  @Get('students/:id/course-progress')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'semester_no', required: false, type: Number })
  async studentCourseProgress(
    @Req() req: any,
    @Param('id') studentId: string,
    @Query('semester_no') semesterNo?: string,
  ) {
    return this.advisorService.getStudentCourseProgress(
      req.user.userId,
      studentId,
      semesterNo ? Number(semesterNo) : undefined,
    );
  }

  @Get('students/:id/next-semester-plan')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'next_semester_no', required: true, type: Number })
  async nextSemesterPlan(
    @Req() req: any,
    @Param('id') studentId: string,
    @Query('next_semester_no') nextSemNo: string,
  ) {
    return this.advisorService.getStudentNextSemesterPlan(
      req.user.userId,
      studentId,
      Number(nextSemNo),
    );
  }

  // ========== NOTES ==========
  @Post('notes')
  @Roles('ADVISOR', 'ADMIN')
  @ApiBody({ type: CreateAdvisoryNoteDto })
  async createNote(@Req() req: any, @Body() dto: CreateAdvisoryNoteDto) {
    return this.advisorService.createAdvisoryNote(req.user.userId, dto);
  }

  @Get('notes')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'student_id', required: true, type: String })
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  async listNotes(
    @Req() req: any,
    @Query('student_id') studentId: string,
    @Query('semester_id') semesterId?: string,
  ) {
    return this.advisorService.listNotesByStudent(req.user.userId, studentId, semesterId);
  }

  @Patch('notes/:id')
  @Roles('ADVISOR', 'ADMIN')
  @ApiBody({ type: UpdateAdvisoryNoteDto })
  async updateNote(
    @Req() req: any,
    @Param('id') noteId: string,
    @Body() dto: UpdateAdvisoryNoteDto,
  ) {
    return this.advisorService.updateAdvisoryNote(req.user.userId, noteId, dto);
  }

  @Delete('notes/:id')
  @Roles('ADVISOR', 'ADMIN')
  async deleteNote(@Req() req: any, @Param('id') noteId: string) {
    return this.advisorService.deleteAdvisoryNote(req.user.userId, noteId);
  }

  // ========== CLASS ANALYTICS ==========
  @Get('classes/:class_id/analytics')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  async classAnalytics(
    @Req() req: any,
    @Param('class_id') classId: string,
    @Query('semester_id') semesterId?: string,
  ) {
    return this.advisorService.getClassAnalytics(req.user.userId, classId, semesterId);
  }

  @Get('classes/:class_id/courses-stats')
  @Roles('ADVISOR', 'ADMIN')
  @ApiQuery({ name: 'semester_id', required: false, type: String })
  async classCourseStats(
    @Req() req: any,
    @Param('class_id') classId: string,
    @Query('semester_id') semesterId?: string,
  ) {
    return this.advisorService.getClassCourseStats(req.user.userId, classId, semesterId);
  }

  @Get('classes/:class_id/retake-list')
  @Roles('ADVISOR', 'ADMIN')
  async classRetakeList(@Req() req: any, @Param('class_id') classId: string) {
    return this.advisorService.getClassRetakeList(req.user.userId, classId);
  }
}
