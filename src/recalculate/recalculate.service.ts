import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const toBigInt = (v: any) => BigInt(String(v));

@Injectable()
export class RecalculateService {
  constructor() {}

  prisma = new PrismaClient();
  async recalcGpa(body: { scope: 'semester'|'class'|'student', semester_id?: string, class_id?: string, student_id?: string }) {
    const scope = body.scope;

    if (scope === 'semester') {
      if (!body.semester_id) throw new BadRequestException('Thiếu semester_id');
      return this.recalcBySemester(toBigInt(body.semester_id));
    }

    if (scope === 'class') {
      if (!body.semester_id || !body.class_id) throw new BadRequestException('Thiếu semester_id/class_id');
      return this.recalcByClass(toBigInt(body.class_id), toBigInt(body.semester_id));
    }

    if (scope === 'student') {
      if (!body.student_id) throw new BadRequestException('Thiếu student_id');
      return this.recalcByStudent(toBigInt(body.student_id), body.semester_id ? toBigInt(body.semester_id) : undefined);
    }

    throw new BadRequestException('scope không hợp lệ');
  }

  private async recalcBySemester(semesterId: bigint) {
    const students = await this.prisma.students.findMany({ select: { student_id: true, class_id: true } });
    let count = 0;
    for (const s of students) {
      await this.computeSnapshotForStudentSemester(s.student_id, s.class_id, semesterId);
      count++;
    }
    return { ok: true, scope: 'semester', semester_id: String(semesterId), students: count };
  }

  private async recalcByClass(classId: bigint, semesterId: bigint) {
    const students = await this.prisma.students.findMany({ where: { class_id: classId }, select: { student_id: true } });
    for (const s of students) {
      await this.computeSnapshotForStudentSemester(s.student_id, classId, semesterId);
    }
    return { ok: true, scope: 'class', class_id: String(classId), semester_id: String(semesterId), students: students.length };
  }

  private async recalcByStudent(studentId: bigint, semesterId?: bigint) {
    const student = await this.prisma.students.findUnique({ where: { student_id: studentId } });
    if (!student) throw new BadRequestException('Student không tồn tại');

    if (semesterId) {
      await this.computeSnapshotForStudentSemester(studentId, student.class_id, semesterId);
      return { ok: true, scope: 'student', student_id: String(studentId), semester_id: String(semesterId) };
    }

    const semesters = await this.prisma.semesters.findMany({ select: { semester_id: true }, orderBy: { start_date: 'asc' } });
    for (const sem of semesters) {
      await this.computeSnapshotForStudentSemester(studentId, student.class_id, sem.semester_id);
    }
    return { ok: true, scope: 'student', student_id: String(studentId), semesters: semesters.length };
  }

  private async computeSnapshotForStudentSemester(studentId: bigint, classId: bigint, semesterId: bigint) {
    const grades = await this.prisma.grades.findMany({
      where: { student_id: studentId, semester_id: semesterId },
      include: { courses: { select: { credits: true } } },
    });

    let creditsAttempted = 0;
    let creditsEarned = 0;
    let creditsFailed = 0;
    let failedCount = 0;

    let sumW = 0;
    let sumC = 0;

    for (const g of grades) {
      const c = g.courses?.credits ?? 0;
      creditsAttempted += c;

      const isPass = g.is_pass === true;
      if (isPass) creditsEarned += c;
      else if (g.is_pass === false) {
        creditsFailed += c;
        failedCount += 1;
      }

      if (g.score_4 != null) {
        sumW += Number(g.score_4) * c;
        sumC += c;
      }
    }

    const gpaSemester = sumC > 0 ? Number((sumW / sumC).toFixed(2)) : null;

    // cumulative: tất cả grade có score_4 đến hết kỳ này
    const allGradesToDate = await this.prisma.grades.findMany({
      where: {
        student_id: studentId,
        semesters: { start_date: { lte: (await this.prisma.semesters.findUnique({ where: { semester_id: semesterId } }))?.start_date ?? new Date() } },
        score_4: { not: null },
      },
      include: { courses: { select: { credits: true } } },
    });

    let sumW2 = 0;
    let sumC2 = 0;
    for (const g of allGradesToDate) {
      const c = g.courses?.credits ?? 0;
      sumW2 += Number(g.score_4) * c;
      sumC2 += c;
    }
    const gpaCum = sumC2 > 0 ? Number((sumW2 / sumC2).toFixed(2)) : null;

    await this.prisma.gpa_snapshots.upsert({
      where: { uq_gpa_student_sem: { student_id: studentId, semester_id: semesterId } } as any,
      create: {
        student_id: studentId,
        class_id: classId,
        semester_id: semesterId,
        gpa_semester: gpaSemester,
        gpa_cumulative: gpaCum,
        credits_attempted_semester: creditsAttempted,
        credits_earned_semester: creditsEarned,
        credits_failed_semester: creditsFailed,
        credits_earned_total: creditsEarned, // bạn có thể tính tổng thật nếu cần
        failed_courses_count_semester: failedCount,
        data_status: grades.length ? 'ok' : 'missing_data',
      },
      update: {
        gpa_semester: gpaSemester,
        gpa_cumulative: gpaCum,
        credits_attempted_semester: creditsAttempted,
        credits_earned_semester: creditsEarned,
        credits_failed_semester: creditsFailed,
        failed_courses_count_semester: failedCount,
        data_status: grades.length ? 'ok' : 'missing_data',
        updated_at: new Date(),
      },
    });
  }
}
