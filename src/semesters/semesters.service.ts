// src/admin/admin.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AssignAdvisorDto, EndAssignmentDto } from './dto/assignment.dto';
import { CreateWarningRuleDto, UpdateWarningRuleDto } from './dto/warning-rule.dto';
import { CreateImportBatchDto } from './dto/import.dto';
import { PrismaClient } from '@prisma/client';
import { PageDto, paginate } from 'src/common/dto/page.dto';

@Injectable()
export class SemestersService {
  constructor() {}
  prisma = new PrismaClient()
  private async audit(userId: string, action: any, objectType?: string, objectId?: bigint, details?: any) {
    await this.prisma.audit_logs.create({
      data: {
        user_id: BigInt(userId),
        action,
        object_type: objectType,
        object_id: objectId,
        details,
      },
    });
  }

  // ===== Semesters =====
  listSemesters() {
    return this.prisma.semesters.findMany({ orderBy: { start_date: 'desc' } });
  }

  async createSemester(userId: string, dto: CreateSemesterDto) {
    const created = await this.prisma.semesters.create({
      data: {
        semester_code: dto.semester_code,
        name: dto.name,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        is_current: dto.is_current ?? false,
      },
    });

    if (dto.is_current) {
      await this.prisma.semesters.updateMany({
        where: { semester_id: { not: created.semester_id } },
        data: { is_current: false },
      });
    }

    await this.audit(userId, 'IMPORT_DATA', 'semesters', created.semester_id, { op: 'create' });
    return created;
  }

  async updateSemester(userId: string, id: string, dto: UpdateSemesterDto) {
    const semId = BigInt(id);
    const exists = await this.prisma.semesters.findUnique({ where: { semester_id: semId } });
    if (!exists) throw new NotFoundException('Semester not found');

    const updated = await this.prisma.semesters.update({
      where: { semester_id: semId },
      data: {
        name: dto.name,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        is_current: dto.is_current,
      },
    });

    if (dto.is_current) {
      await this.prisma.semesters.updateMany({
        where: { semester_id: { not: semId } },
        data: { is_current: false },
      });
    }

    await this.audit(userId, 'IMPORT_DATA', 'semesters', semId, { op: 'update', dto });
    return updated;
  }

  async setCurrentSemester(userId: string, id: string) {
    const semId = BigInt(id);
    const exists = await this.prisma.semesters.findUnique({ where: { semester_id: semId } });
    if (!exists) throw new NotFoundException('Semester not found');

    await this.prisma.semesters.updateMany({ data: { is_current: false } });
    const updated = await this.prisma.semesters.update({
      where: { semester_id: semId },
      data: { is_current: true },
    });

    await this.audit(userId, 'IMPORT_DATA', 'semesters', semId, { op: 'set_current' });
    return updated;
  }

  // ===== Courses =====
  async listCourses(page: PageDto) {
    const { skip, take } = paginate(page.page, page.limit);
    const [items, total] = await Promise.all([
      this.prisma.courses.findMany({ skip, take, orderBy: { course_code: 'asc' } }),
      this.prisma.courses.count(),
    ]);
    return { items, total, page: page.page, limit: page.limit };
  }

  async createCourse(userId: string, dto: CreateCourseDto) {
    const created = await this.prisma.courses.create({ data: { ...dto } as any });
    await this.audit(userId, 'IMPORT_DATA', 'courses', created.course_id, { op: 'create' });
    return created;
  }

  async updateCourse(userId: string, id: string, dto: UpdateCourseDto) {
    const courseId = BigInt(id);
    const exists = await this.prisma.courses.findUnique({ where: { course_id: courseId } });
    if (!exists) throw new NotFoundException('Course not found');

    const updated = await this.prisma.courses.update({ where: { course_id: courseId }, data: dto as any });
    await this.audit(userId, 'IMPORT_DATA', 'courses', courseId, { op: 'update', dto });
    return updated;
  }

  // ===== Classes =====
  async listClasses(q?: string, page?: PageDto) {
    const { skip, take } = paginate(page?.page, page?.limit);
    const where = q
      ? { OR: [{ class_code: { contains: q } }, { class_name: { contains: q } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.classes.findMany({ where, skip, take, orderBy: { class_code: 'asc' } }),
      this.prisma.classes.count({ where }),
    ]);
    return { items, total, page: page?.page ?? 1, limit: page?.limit ?? 10 };
  }

  async createClass(userId: string, dto: CreateClassDto) {
    const created = await this.prisma.classes.create({ data: dto as any });
    await this.audit(userId, 'IMPORT_DATA', 'classes', created.class_id, { op: 'create' });
    return created;
  }

  async updateClass(userId: string, id: string, dto: UpdateClassDto) {
    const classId = BigInt(id);
    const exists = await this.prisma.classes.findUnique({ where: { class_id: classId } });
    if (!exists) throw new NotFoundException('Class not found');

    const updated = await this.prisma.classes.update({ where: { class_id: classId }, data: dto as any });
    await this.audit(userId, 'IMPORT_DATA', 'classes', classId, { op: 'update', dto });
    return updated;
  }

  // ===== Students =====
  async listStudents(q?: string, page?: PageDto) {
    const { skip, take } = paginate(page?.page, page?.limit);
    const where = q
      ? { OR: [{ student_code: { contains: q } }, { full_name: { contains: q } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.students.findMany({
        where, skip, take, orderBy: { student_code: 'asc' },
        include: { classes: true },
      }),
      this.prisma.students.count({ where }),
    ]);
    return { items, total, page: page?.page ?? 1, limit: page?.limit ?? 10 };
  }

  async createStudent(userId: string, dto: CreateStudentDto) {
    const classId = BigInt(dto.class_id);
    const cls = await this.prisma.classes.findUnique({ where: { class_id: classId } });
    if (!cls) throw new BadRequestException('Invalid class_id');

    const created = await this.prisma.students.create({
      data: {
        student_code: dto.student_code,
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        class_id: classId,
        cohort_year: dto.cohort_year,
        major_name: dto.major_name ?? cls.major_name,
        academic_status: (dto.academic_status as any) ?? 'studying',
      },
    });
    await this.audit(userId, 'IMPORT_DATA', 'students', created.student_id, { op: 'create' });
    return created;
  }

  async updateStudent(userId: string, id: string, dto: UpdateStudentDto) {
    const studentId = BigInt(id);
    const exists = await this.prisma.students.findUnique({ where: { student_id: studentId } });
    if (!exists) throw new NotFoundException('Student not found');

    const updated = await this.prisma.students.update({
      where: { student_id: studentId },
      data: {
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        class_id: dto.class_id ? BigInt(dto.class_id) : undefined,
        academic_status: dto.academic_status as any,
      },
    });

    await this.audit(userId, 'IMPORT_DATA', 'students', studentId, { op: 'update', dto });
    return updated;
  }

  // ===== Users =====
  async listUsers(q?: string, page?: PageDto) {
    const { skip, take } = paginate(page?.page, page?.limit);
    const where = q
      ? { OR: [{ username: { contains: q } }, { full_name: { contains: q } }, { email: { contains: q } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.users.findMany({ where, skip, take, orderBy: { user_id: 'desc' } }),
      this.prisma.users.count({ where }),
    ]);
    return { items, total, page: page?.page ?? 1, limit: page?.limit ?? 10 };
  }

  async createUser(userId: string, dto: CreateUserDto) {
    const created = await this.prisma.users.create({ data: dto as any });
    await this.audit(userId, 'IMPORT_DATA', 'users', created.user_id, { op: 'create' });
    return created;
  }

  async updateUser(userId: string, id: string, dto: UpdateUserDto) {
    const targetId = BigInt(id);
    const exists = await this.prisma.users.findUnique({ where: { user_id: targetId } });
    if (!exists) throw new NotFoundException('User not found');

    const updated = await this.prisma.users.update({ where: { user_id: targetId }, data: dto as any });
    await this.audit(userId, 'IMPORT_DATA', 'users', targetId, { op: 'update', dto });
    return updated;
  }

  // ===== Advisor assignments =====
  async assignAdvisor(userId: string, classIdStr: string, dto: AssignAdvisorDto) {
    const classId = BigInt(classIdStr);
    const advisorId = BigInt(dto.advisor_user_id);

    const cls = await this.prisma.classes.findUnique({ where: { class_id: classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const advisor = await this.prisma.users.findUnique({ where: { user_id: advisorId } });
    if (!advisor || advisor.role !== 'ADVISOR') throw new BadRequestException('advisor_user_id must be ADVISOR');

    const created = await this.prisma.class_advisor_assignments.create({
      data: {
        class_id: classId,
        advisor_user_id: advisorId,
        from_date: new Date(dto.from_date),
        to_date: dto.to_date ? new Date(dto.to_date) : null,
        is_primary: dto.is_primary ?? true,
      },
    });

    if (dto.is_primary ?? true) {
      await this.prisma.classes.update({
        where: { class_id: classId },
        data: { current_advisor_user_id: advisorId },
      });
    }

    await this.audit(userId, 'IMPORT_DATA', 'class_advisor_assignments', created.assignment_id, { op: 'assign' });
    return created;
  }

  async endAssignment(userId: string, assignmentIdStr: string, dto: EndAssignmentDto) {
    const assignmentId = BigInt(assignmentIdStr);
    const exists = await this.prisma.class_advisor_assignments.findUnique({ where: { assignment_id: assignmentId } });
    if (!exists) throw new NotFoundException('Assignment not found');

    const updated = await this.prisma.class_advisor_assignments.update({
      where: { assignment_id: assignmentId },
      data: { to_date: new Date(dto.to_date) },
    });

    await this.audit(userId, 'IMPORT_DATA', 'class_advisor_assignments', assignmentId, { op: 'end', dto });
    return updated;
  }

  async getAssignmentHistory(classIdStr: string) {
    const classId = BigInt(classIdStr);
    return this.prisma.class_advisor_assignments.findMany({
      where: { class_id: classId },
      orderBy: { from_date: 'desc' },
      include: { users: true },
    });
  }

  // ===== Warning rules =====
  listWarningRules() {
    return this.prisma.warning_rules.findMany({ orderBy: { is_active: 'desc' } });
  }

  async createWarningRule(userId: string, dto: CreateWarningRuleDto) {
    const created = await this.prisma.warning_rules.create({ data: dto as any });
    await this.audit(userId, 'GENERATE_WARNING', 'warning_rules', created.rule_id, { op: 'create' });
    return created;
  }

  async updateWarningRule(userId: string, id: string, dto: UpdateWarningRuleDto) {
    const ruleId = BigInt(id);
    const exists = await this.prisma.warning_rules.findUnique({ where: { rule_id: ruleId } });
    if (!exists) throw new NotFoundException('Rule not found');

    const updated = await this.prisma.warning_rules.update({ where: { rule_id: ruleId }, data: dto as any });
    await this.audit(userId, 'GENERATE_WARNING', 'warning_rules', ruleId, { op: 'update', dto });
    return updated;
  }

  // ===== Imports =====
  async createImportBatch(userId: string, dto: CreateImportBatchDto) {
    const created = await this.prisma.import_batches.create({
      data: {
        import_type: dto.import_type as any,
        file_name: dto.file_name,
        status: 'processing',
        created_by: BigInt(userId),
      },
    });
    await this.audit(userId, 'IMPORT_DATA', 'import_batches', created.batch_id, { op: 'create' });
    return created;
  }

  async getImportBatch(id: string) {
    return this.prisma.import_batches.findUnique({ where: { batch_id: BigInt(id) } });
  }

  // ===== Audit logs =====
  async listAuditLogs(action?: string, userId?: string, page?: PageDto) {
    const { skip, take } = paginate(page?.page, page?.limit);
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.user_id = BigInt(userId);

    const [items, total] = await Promise.all([
      this.prisma.audit_logs.findMany({ where, skip, take, orderBy: { created_at: 'desc' } }),
      this.prisma.audit_logs.count({ where }),
    ]);
    return { items, total, page: page?.page ?? 1, limit: page?.limit ?? 10 };
  }
}
