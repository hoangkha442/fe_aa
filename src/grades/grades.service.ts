import { BadRequestException, Injectable } from '@nestjs/common';
import { ListGradesDto } from './dto/list-grades.dto';
import { UpsertGradeDto } from './dto/upsert-grade.dto';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const toBigInt = (v: any) => BigInt(String(v));

function score10ToScore4(score10: number): number {
  // mapping mẫu (bạn có thể thay theo quy định trường)
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 8.0) return 3.5;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.5) return 2.5;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 5.0) return 1.5;
  if (score10 >= 4.0) return 1.0;
  return 0.0;
}

function score10ToLetter(score10: number): string {
  if (score10 >= 8.5) return 'A';
  if (score10 >= 8.0) return 'B+';
  if (score10 >= 7.0) return 'B';
  if (score10 >= 6.5) return 'C+';
  if (score10 >= 5.5) return 'C';
  if (score10 >= 5.0) return 'D+';
  if (score10 >= 4.0) return 'D';
  return 'F';
}

@Injectable()
export class GradesService {
  constructor() {}

  prisma = new PrismaClient()
  async listGrades(dto: ListGradesDto) {
    const page = Math.max(1, Number(dto.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(dto.limit ?? 10)));
    const skip = (page - 1) * limit;

    const classId = toBigInt(dto.class_id);
    const semesterId = dto.semester_id ? toBigInt(dto.semester_id) : undefined;
    const q = dto.q?.trim();

    const where: any = { class_id: classId };
    if (semesterId) where.semester_id = semesterId;
    if (q) {
      where.OR = [
        { students: { student_code: { contains: q } } },
        { students: { full_name: { contains: q } } },
        { courses: { course_code: { contains: q } } },
        { courses: { course_name: { contains: q } } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.grades.count({ where }),
      this.prisma.grades.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: {
          students: { select: { student_id: true, student_code: true, full_name: true } },
          courses: { select: { course_id: true, course_code: true, course_name: true, credits: true } },
          semesters: { select: { semester_id: true, semester_code: true, name: true } },
        },
      }),
    ]);

    return { page, limit, total, items };
  }

  async upsertGrade(actorUserId: any, dto: UpsertGradeDto, allowCreate = true) {
    const studentId = toBigInt(dto.student_id);
    const classId = toBigInt(dto.class_id);
    const semesterId = toBigInt(dto.semester_id);
    const courseId = toBigInt(dto.course_id);
    const attemptNo = dto.attempt_no ?? 1;

    let score10 = dto.score_10;
    let score4 = dto.score_4;
    let letter = dto.letter_grade;

    if (score10 != null) {
      if (score10 < 0 || score10 > 10) throw new BadRequestException('score_10 ngoài phạm vi 0..10');
      score4 ??= score10ToScore4(score10);
      letter ??= score10ToLetter(score10);
    }

    // pass rule theo class policy (fallback 4.0)
    const policy = await this.prisma.grading_policies.findFirst({ where: { class_id: classId } });
    const passScore = Number(policy?.pass_score_10 ?? 4.0);
    const isPass = score10 != null ? score10 >= passScore : null;

    const existing = await this.prisma.grades.findFirst({
      where: { student_id: studentId, semester_id: semesterId, course_id: courseId, attempt_no: attemptNo },
    });

    if (!existing && !allowCreate) throw new BadRequestException('Không tìm thấy grade để cập nhật');

    if (!existing) {
      return this.prisma.grades.create({
        data: {
          student_id: studentId,
          class_id: classId,
          semester_id: semesterId,
          course_id: courseId,
          attempt_no: attemptNo,
          score_10: score10 ?? null,
          score_4: score4 ?? null,
          letter_grade: letter ?? null,
          is_pass: isPass,
          note: dto.note ?? null,
          updated_by: toBigInt(actorUserId),
        },
      });
    }

    // update + log
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.grade_change_logs.create({
        data: {
          grade_id: existing.grade_id,
          changed_by: toBigInt(actorUserId),
          old_score_10: existing.score_10,
          new_score_10: score10 ?? existing.score_10,
          old_letter_grade: existing.letter_grade,
          new_letter_grade: letter ?? existing.letter_grade,
          old_score_4: existing.score_4,
          new_score_4: score4 ?? existing.score_4,
          old_is_pass: existing.is_pass,
          new_is_pass: isPass ?? existing.is_pass,
          reason: 'Manual upsert/update',
        },
      });

      return tx.grades.update({
        where: { grade_id: existing.grade_id },
        data: {
          score_10: score10 ?? existing.score_10,
          score_4: score4 ?? existing.score_4,
          letter_grade: letter ?? existing.letter_grade,
          is_pass: isPass ?? existing.is_pass,
          note: dto.note ?? existing.note,
          updated_by: toBigInt(actorUserId),
          updated_at: new Date(),
        },
      });
    });

    return updated;
  }

  async updateGrade(actorUserId: any, gradeId: string, patch: Partial<UpsertGradeDto>) {
    const id = toBigInt(gradeId);

    const current = await this.prisma.grades.findUnique({ where: { grade_id: id } });
    if (!current) throw new BadRequestException('Grade không tồn tại');

    const dto: UpsertGradeDto = {
      student_id: String(current.student_id),
      class_id: String(current.class_id),
      semester_id: String(current.semester_id),
      course_id: String(current.course_id),
      attempt_no: current.attempt_no,
      score_10: patch.score_10 as any,
      score_4: patch.score_4 as any,
      letter_grade: patch.letter_grade as any,
      note: patch.note as any,
    };

    // reuse upsert logic (update existing)
    return this.upsertGrade(actorUserId, dto, false);
  }

  async importGrades(actorUserId: any, file: Express.Multer.File, overwrite: boolean) {
    if (!file) throw new BadRequestException('Thiếu file import');

    const batch = await this.prisma.import_batches.create({
      data: {
        import_type: 'grades',
        file_name: file.originalname,
        status: 'processing',
        created_by: toBigInt(actorUserId),
      },
    });

    try {
      const wb = XLSX.read(file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

      // Expect columns (gợi ý): student_code, class_code, semester_code, course_code, score_10, attempt_no
      const errors: any[] = [];
      let okCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNo = i + 2;

        const studentCode = String(r.student_code ?? '').trim();
        const classCode = String(r.class_code ?? '').trim();
        const semesterCode = String(r.semester_code ?? '').trim();
        const courseCode = String(r.course_code ?? '').trim();
        const attemptNo = Number(r.attempt_no ?? 1);
        const score10 = r.score_10 != null ? Number(r.score_10) : null;

        if (!studentCode || !classCode || !semesterCode || !courseCode) {
          errors.push({ row: rowNo, error: 'Thiếu student_code/class_code/semester_code/course_code' });
          continue;
        }

        const [student, cls, sem, course] = await Promise.all([
          this.prisma.students.findFirst({ where: { student_code: studentCode } }),
          this.prisma.classes.findFirst({ where: { class_code: classCode } }),
          this.prisma.semesters.findFirst({ where: { semester_code: semesterCode } }),
          this.prisma.courses.findFirst({ where: { course_code: courseCode } }),
        ]);

        if (!student) { errors.push({ row: rowNo, error: `Không tìm thấy student_code=${studentCode}` }); continue; }
        if (!cls) { errors.push({ row: rowNo, error: `Không tìm thấy class_code=${classCode}` }); continue; }
        if (!sem) { errors.push({ row: rowNo, error: `Không tìm thấy semester_code=${semesterCode}` }); continue; }
        if (!course) { errors.push({ row: rowNo, error: `Không tìm thấy course_code=${courseCode}` }); continue; }

        // optional: verify student thuộc lớp
        if (String(student.class_id) !== String(cls.class_id)) {
          errors.push({ row: rowNo, error: `SV ${studentCode} không thuộc lớp ${classCode}` });
          continue;
        }

        // existing check
        const existing = await this.prisma.grades.findFirst({
          where: {
            student_id: student.student_id,
            semester_id: sem.semester_id,
            course_id: course.course_id,
            attempt_no: attemptNo,
          },
        });

        if (existing && !overwrite) {
          errors.push({ row: rowNo, error: `Trùng bản ghi (đã có) - bật overwrite để ghi đè` });
          continue;
        }

        await this.upsertGrade(actorUserId, {
          student_id: String(student.student_id),
          class_id: String(cls.class_id),
          semester_id: String(sem.semester_id),
          course_id: String(course.course_id),
          attempt_no: attemptNo,
          score_10: score10 ?? undefined,
        }, true);

        okCount++;
      }

      await this.prisma.import_batches.update({
        where: { batch_id: batch.batch_id },
        data: {
          status: errors.length ? 'failed' : 'success',
          errors_json: { ok: okCount, errors },
        },
      });

      return { batch_id: String(batch.batch_id), ok: okCount, errors_count: errors.length, errors };
    } catch (e: any) {
      await this.prisma.import_batches.update({
        where: { batch_id: batch.batch_id },
        data: { status: 'failed', errors_json: { message: e?.message ?? 'Import failed' } },
      });
      throw e;
    }
  }
}
