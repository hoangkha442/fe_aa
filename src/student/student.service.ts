import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginate } from 'src/common/dto/page.dto';
import { StudentWarningsQueryDto } from './dto/student-warnings.dto';
import { StudentSnapshotsQueryDto } from './dto/student-snapshots.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StudentService {
  constructor() {}
  prisma = new PrismaClient();
  private async getStudentByUser(userId: string) {
    const st = await this.prisma.students.findUnique({
      where: { user_id: BigInt(userId) },
    });
    if (!st)
      throw new ForbiddenException('Student profile not linked to this user');
    return st;
  }

  async listMyWarnings(userId: string, dto: StudentWarningsQueryDto) {
    const st = await this.getStudentByUser(userId);
    const { skip, take } = paginate(dto.page, dto.limit);

    const where: any = { student_id: st.student_id };
    if (dto.semester_id) where.semester_id = BigInt(dto.semester_id);
    if (dto.status) where.status = dto.status;

    const [items, total] = await Promise.all([
      this.prisma.warnings.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { warning_rules: true, semesters: true },
      }),
      this.prisma.warnings.count({ where }),
    ]);

    return { items, total, page: dto.page ?? 1, limit: dto.limit ?? 10 };
  }

  async getMyWarningDetail(userId: string, warningIdStr: string) {
    const st = await this.getStudentByUser(userId);
    const warningId = BigInt(warningIdStr);

    const w = await this.prisma.warnings.findUnique({
      where: { warning_id: warningId },
      include: {
        warning_rules: true,
        semesters: true,
        warning_send_logs: { orderBy: { attempted_at: 'desc' } },
        advisory_notes: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!w) throw new NotFoundException('Warning not found');
    if (w.student_id !== st.student_id)
      throw new ForbiddenException('Not your warning');
    return w;
  }

  async acknowledgeWarning(userId: string, warningIdStr: string) {
    const st = await this.getStudentByUser(userId);
    const warningId = BigInt(warningIdStr);

    const w = await this.prisma.warnings.findUnique({
      where: { warning_id: warningId },
    });
    if (!w) throw new NotFoundException('Warning not found');
    if (w.student_id !== st.student_id)
      throw new ForbiddenException('Not your warning');

    return this.prisma.warnings.update({
      where: { warning_id: warningId },
      data: {
        status: 'Acknowledged',
        acknowledged_at: new Date(),
        acknowledged_by: BigInt(userId),
      },
    });
  }

  async listMyGrades(userId: string, semesterIdStr?: string) {
    const st = await this.getStudentByUser(userId);
    const where: any = { student_id: st.student_id };
    if (semesterIdStr) where.semester_id = BigInt(semesterIdStr);

    return this.prisma.grades.findMany({
      where,
      orderBy: [{ semester_id: 'desc' }, { course_id: 'asc' }],
      include: { courses: true, semesters: true },
    });
  }

  async listMySnapshots(userId: string, dto: StudentSnapshotsQueryDto) {
    const st = await this.getStudentByUser(userId);
    const where: any = { student_id: st.student_id };

    if (dto.from_semester_id || dto.to_semester_id) {
      where.semester_id = {
        ...(dto.from_semester_id ? { gte: BigInt(dto.from_semester_id) } : {}),
        ...(dto.to_semester_id ? { lte: BigInt(dto.to_semester_id) } : {}),
      };
    }

    return this.prisma.gpa_snapshots.findMany({
      where,
      orderBy: { semester_id: 'desc' },
      include: { semesters: true },
    });
  }

  async getProgressSummary(userId: string, semesterIdStr: string) {
    const st = await this.getStudentByUser(userId);
    const semesterId = BigInt(semesterIdStr);

    const snapshot = await this.prisma.gpa_snapshots.findUnique({
      where: {
        student_id_semester_id: {
          student_id: st.student_id,
          semester_id: semesterId,
        },
      },
      include: { semesters: true },
    });

    const failedGrades = await this.prisma.grades.findMany({
      where: {
        student_id: st.student_id,
        semester_id: semesterId,
        is_pass: false,
      },
      include: { courses: true },
    });

    return {
      semester: snapshot?.semesters ?? null,
      snapshot: snapshot ?? null,
      failed_courses: failedGrades.map((g) => ({
        course_code: g.courses.course_code,
        course_name: g.courses.course_name,
        score_10: g.score_10,
        letter_grade: g.letter_grade,
        attempt_no: g.attempt_no,
      })),
    };
  }
}
