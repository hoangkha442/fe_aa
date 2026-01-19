// src/admin/admin.controller.ts
import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AssignAdvisorDto, EndAssignmentDto } from './dto/assignment.dto';
import { CreateWarningRuleDto, UpdateWarningRuleDto } from './dto/warning-rule.dto';
import { CreateImportBatchDto } from './dto/import.dto';
import { SemestersService } from 'src/semesters/semesters.service';
import { PageDto } from 'src/common/dto/page.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class SemestersController {
  constructor(private readonly SemestersServices: SemestersService) {}

  // ===== Semesters =====
  @Get('semesters')
  async listSemesters() {
    return this.SemestersServices.listSemesters();
  }

  @Post('semesters')
  async createSemester(@Req() req: any, @Body() dto: CreateSemesterDto) {
    return this.SemestersServices.createSemester(req.user.userId, dto);
  }

  @Patch('semesters/:id')
  async updateSemester(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.SemestersServices.updateSemester(req.user.userId, id, dto);
  }

  @Post('semesters/:id/set-current')
  async setCurrentSemester(@Req() req: any, @Param('id') id: string) {
    return this.SemestersServices.setCurrentSemester(req.user.userId, id);
  }

  // ===== Courses =====
  @Get('courses')
  async listCourses(@Query() page: PageDto) {
    return this.SemestersServices.listCourses(page);
  }

  @Post('courses')
  async createCourse(@Req() req: any, @Body() dto: CreateCourseDto) {
    return this.SemestersServices.createCourse(req.user.userId, dto);
  }

  @Patch('courses/:id')
  async updateCourse(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.SemestersServices.updateCourse(req.user.userId, id, dto);
  }

  // ===== Classes =====
  @Get('classes')
  @ApiQuery({ name: 'q', required: false })
  async listClasses(@Query('q') q?: string, @Query() page?: PageDto) {
    return this.SemestersServices.listClasses(q, page);
  }

  @Post('classes')
  async createClass(@Req() req: any, @Body() dto: CreateClassDto) {
    return this.SemestersServices.createClass(req.user.userId, dto);
  }

  @Patch('classes/:id')
  async updateClass(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.SemestersServices.updateClass(req.user.userId, id, dto);
  }

  // ===== Students =====
  @Get('students')
  @ApiQuery({ name: 'q', required: false, description: 'student_code/full_name' })
  async listStudents(@Query('q') q?: string, @Query() page?: PageDto) {
    return this.SemestersServices.listStudents(q, page);
  }

  @Post('students')
  async createStudent(@Req() req: any, @Body() dto: CreateStudentDto) {
    return this.SemestersServices.createStudent(req.user.userId, dto);
  }

  @Patch('students/:id')
  async updateStudent(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.SemestersServices.updateStudent(req.user.userId, id, dto);
  }

  // ===== Users =====
  @Get('users')
  @ApiQuery({ name: 'q', required: false, description: 'username/full_name/email' })
  async listUsers(@Query('q') q?: string, @Query() page?: PageDto) {
    return this.SemestersServices.listUsers(q, page);
  }

  @Post('users')
  async createUser(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.SemestersServices.createUser(req.user.userId, dto);
  }

  @Patch('users/:id')
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.SemestersServices.updateUser(req.user.userId, id, dto);
  }

  // ===== Assign advisors =====
  @Post('classes/:class_id/advisors')
  async assignAdvisor(
    @Req() req: any,
    @Param('class_id') classId: string,
    @Body() dto: AssignAdvisorDto,
  ) {
    return this.SemestersServices.assignAdvisor(req.user.userId, classId, dto);
  }

  @Patch('class-advisor-assignments/:id/end')
  async endAssignment(@Req() req: any, @Param('id') id: string, @Body() dto: EndAssignmentDto) {
    return this.SemestersServices.endAssignment(req.user.userId, id, dto);
  }

  @Get('classes/:class_id/advisors/history')
  async assignmentHistory(@Param('class_id') classId: string) {
    return this.SemestersServices.getAssignmentHistory(classId);
  }

  // ===== Warning rules =====
  @Get('warning-rules')
  async listWarningRules() {
    return this.SemestersServices.listWarningRules();
  }

  @Post('warning-rules')
  async createWarningRule(@Req() req: any, @Body() dto: CreateWarningRuleDto) {
    return this.SemestersServices.createWarningRule(req.user.userId, dto);
  }

  @Patch('warning-rules/:id')
  async updateWarningRule(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateWarningRuleDto) {
    return this.SemestersServices.updateWarningRule(req.user.userId, id, dto);
  }

  // ===== Imports =====
  @Post('imports')
  async createImport(@Req() req: any, @Body() dto: CreateImportBatchDto) {
    return this.SemestersServices.createImportBatch(req.user.userId, dto);
  }

  @Get('imports/:id')
  async getImport(@Param('id') id: string) {
    return this.SemestersServices.getImportBatch(id);
  }

  // ===== Audit logs =====
  @Get('audit-logs')
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  async listAuditLogs(@Query('action') action?: string, @Query('user_id') userId?: string, @Query() page?: PageDto) {
    return this.SemestersServices.listAuditLogs(action, userId, page);
  }
}
