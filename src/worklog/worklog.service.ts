import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  buildPaginationResponse,
  parsePaginationQuery,
} from 'src/common/helpers/pagination.helper';
import { CreateWorkLogDto } from 'src/worklog/dto/create-worklog.dto';
import { UpdateWorkLogDto } from 'src/worklog/dto/update-worklog.dto';

@Injectable()
export class WorklogService {
  prisma = new PrismaClient();

  async getStudentWorkLogs(
    studentUserId: string,
    internshipId: string,
    page: number,
    limit: number,
  ) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: BigInt(studentUserId) },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const internship = await this.prisma.internships.findUnique({
      where: { id: BigInt(internshipId) },
      select: { id: true, student_id: true },
    });
    if (!internship) throw new NotFoundException('Không tìm thấy internship');
    if (internship.student_id !== BigInt(student.id)) {
      throw new BadRequestException(
        'Bạn không có quyền xem worklog của internship này',
      );
    }

    const { page: p, limit: l } = parsePaginationQuery({
      page,
      limit,
      maxLimit: 50,
    });
    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      this.prisma.work_logs.findMany({
        where: { internship_id: BigInt(internshipId) },
        skip,
        take: l,
        orderBy: [{ work_date: 'desc' }, { created_at: 'desc' }],
        include: { work_log_attachments: true },
      }),
      this.prisma.work_logs.count({
        where: { internship_id: BigInt(internshipId) },
      }),
    ]);

    return buildPaginationResponse(items, total, p, l);
  }

  async createStudentWorkLog(studentUserId: string, dto: CreateWorkLogDto) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: BigInt(studentUserId) },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const internship = await this.prisma.internships.findUnique({
      where: { id: BigInt(dto.internship_id) },
      select: { id: true, student_id: true },
    });
    if (!internship) throw new NotFoundException('Không tìm thấy internship');
    if (internship.student_id !== BigInt(student.id)) {
      throw new BadRequestException(
        'Bạn không có quyền tạo worklog cho internship này',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.work_logs.create({
        data: {
          internship_id: BigInt(dto.internship_id),
          work_date: new Date(dto.work_date),
          content: dto.content,
        },
      });

      const attachments = dto.attachments ?? [];
      if (attachments.length) {
        await tx.work_log_attachments.createMany({
          data: attachments.map((a) => ({
            work_log_id: log.id,
            file_path: a.file_path,
            description: a.description ?? null,
          })),
        });
      }

      const full = await tx.work_logs.findUnique({
        where: { id: log.id },
        include: { work_log_attachments: true },
      });

      return { message: 'Tạo worklog thành công', worklog: full };
    });
  }

  async updateStudentWorkLog(
    studentUserId: string,
    workLogId: string,
    dto: UpdateWorkLogDto,
  ) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: BigInt(studentUserId) },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const log = await this.prisma.work_logs.findUnique({
      where: { id: BigInt(workLogId) },
      include: { internships: true },
    });
    if (!log) throw new NotFoundException('Worklog không tồn tại');

    if (log.internships.student_id !== BigInt(student.id)) {
      throw new BadRequestException('Bạn không có quyền sửa worklog này');
    }

    // nếu đã chấm thì không cho sửa
    if (log.score !== null || (log.feedback && String(log.feedback).trim())) {
      throw new BadRequestException(
        'Worklog đã được giảng viên đánh giá, không thể chỉnh sửa',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.work_logs.update({
        where: { id: BigInt(workLogId) },
        data: {
          work_date: dto.work_date ? new Date(dto.work_date) : undefined,
          content: dto.content ?? undefined,
        },
      });

      // replace attachments nếu gửi
      if (dto.attachments) {
        await tx.work_log_attachments.deleteMany({
          where: { work_log_id: updated.id },
        });
        if (dto.attachments.length) {
          await tx.work_log_attachments.createMany({
            data: dto.attachments.map((a) => ({
              work_log_id: updated.id,
              file_path: a.file_path,
              description: a.description ?? null,
            })),
          });
        }
      }

      const full = await tx.work_logs.findUnique({
        where: { id: updated.id },
        include: { work_log_attachments: true },
      });

      return { message: 'Cập nhật worklog thành công', worklog: full };
    });
  }

  async deleteStudentWorkLog(studentUserId: string, workLogId: string) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: BigInt(studentUserId) },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const log = await this.prisma.work_logs.findUnique({
      where: { id: BigInt(workLogId) },
      include: { internships: true },
    });
    if (!log) throw new NotFoundException('Worklog không tồn tại');

    if (log.internships.student_id !== BigInt(student.id)) {
      throw new BadRequestException('Bạn không có quyền xoá worklog này');
    }

    if (log.score !== null || (log.feedback && String(log.feedback).trim())) {
      throw new BadRequestException(
        'Worklog đã được giảng viên đánh giá, không thể xoá',
      );
    }

    await this.prisma.work_logs.delete({ where: { id: BigInt(workLogId) } });
    return { message: 'Xoá worklog thành công' };
  }
}
