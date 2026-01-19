import { BadRequestException, Injectable } from '@nestjs/common';
import { BulkCurriculumDto } from './dto/bulk-curriculum.dto';
import { PrismaClient } from '@prisma/client';

const toBigInt = (v: any) => BigInt(String(v));

@Injectable()
export class CurriculumService {
  constructor() {}

    prisma = new PrismaClient();
  async bulkUpsert(dto: BulkCurriculumDto) {
    const classId = toBigInt(dto.class_id);

    // validate class exists
    const cls = await this.prisma.classes.findUnique({ where: { class_id: classId } });
    if (!cls) throw new BadRequestException('Class không tồn tại');

    // upsert từng item theo unique(class_id, course_id)
    const ops = dto.items.map((it) => {
      const courseId = toBigInt(it.course_id);
      return this.prisma.curriculum_items.upsert({
        where: { uq_curriculum_class_course: { class_id: classId, course_id: courseId } } as any,
        create: {
          class_id: classId,
          course_id: courseId,
          semester_no: it.semester_no,
          is_required: it.is_required,
        },
        update: {
          semester_no: it.semester_no,
          is_required: it.is_required,
        },
      });
    });

    const result = await this.prisma.$transaction(ops);
    return { ok: true, count: result.length };
  }

  async listByClass(classIdStr: string, semesterNo?: number) {
    const classId = toBigInt(classIdStr);
    const where: any = { class_id: classId };
    if (semesterNo != null) where.semester_no = semesterNo;

    return this.prisma.curriculum_items.findMany({
      where,
      orderBy: [{ semester_no: 'asc' }, { course_id: 'asc' }],
      include: { courses: { select: { course_code: true, course_name: true, credits: true } } },
    });
  }
}
