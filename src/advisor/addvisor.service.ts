// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// import {
//   buildPaginationResponse,
//   parsePaginationQuery,
// } from 'src/common/helpers/pagination.helper';

// import { GetAdvisorClassesDto } from './dto/get-advisor-classes.dto';
// import { GetAdvisorDashboardDto } from './dto/get-advisor-dashboard.dto';
// import { PreviewWarningsDto } from './dto/preview-warnings.dto';
// import { GenerateWarningsDto } from './dto/generate-warnings.dto';
// import { SendWarningsDto } from './dto/send-warnings.dto';
// import { UpdateWarningStatusDto } from './dto/update-warning-status.dto';
// import { CreateAdvisoryNoteDto } from './dto/create-advisory-note.dto';
// import { GetAdvisorStudentDetailDto } from './dto/get-advisor-student-detail.dto';

// function toBigInt(id: string | number | bigint): bigint {
//   if (typeof id === 'bigint') return id;
//   if (typeof id === 'number') return BigInt(id);
//   if (typeof id === 'string') return BigInt(id);
//   throw new Error('Invalid id');
// }
// function idToString(v: any): string {
//   if (typeof v === 'bigint') return v.toString();
//   if (typeof v === 'number') return String(v);
//   if (typeof v === 'string') return v;
//   return String(v ?? '');
// }
// function decimalToNumber(v: any): number | null {
//   if (v === null || v === undefined) return null;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// }
// function startOfToday(): Date {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d;
// }
// type Operator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';
// function compare(operator: Operator, value: number, threshold: number): boolean {
//   switch (operator) {
//     case 'LT':
//       return value < threshold;
//     case 'LTE':
//       return value <= threshold;
//     case 'GT':
//       return value > threshold;
//     case 'GTE':
//       return value >= threshold;
//     case 'EQ':
//       return value === threshold;
//     case 'NEQ':
//       return value !== threshold;
//     default:
//       return false;
//   }
// }

// @Injectable()
// export class AdvisorService {
//   prisma = new PrismaClient();

//   // ====== ACCESS CHECK ======
//   private async assertAdvisorCanAccessClass(advisorUserId: string, classId: string) {
//     const today = startOfToday();
//     const assignment = await this.prisma.class_advisor_assignments.findFirst({
//       where: {
//         advisor_user_id: toBigInt(advisorUserId),
//         class_id: toBigInt(classId),
//         from_date: { lte: today },
//         OR: [{ to_date: null }, { to_date: { gte: today } }],
//       },
//       select: { assignment_id: true },
//     });

//     if (!assignment) {
//       // nếu bạn muốn admin bypass ở service, có thể check req.user.role ở controller
//       throw new ForbiddenException('Bạn không có quyền truy cập lớp này');
//     }
//   }

//   private async assertAdvisorCanAccessStudent(advisorUserId: string, studentId: string) {
//     const st = await this.prisma.students.findUnique({
//       where: { student_id: toBigInt(studentId) },
//       select: { class_id: true },
//     });
//     if (!st) throw new NotFoundException('Sinh viên không tồn tại');
//     await this.assertAdvisorCanAccessClass(advisorUserId, String(st.class_id));
//   }

//   private async resolveSemester(semesterId?: string) {
//     if (semesterId) {
//       const s = await this.prisma.semesters.findUnique({
//         where: { semester_id: toBigInt(semesterId) },
//       });
//       if (!s) throw new NotFoundException('Học kỳ không tồn tại');
//       return s;
//     }

//     const cur = await this.prisma.semesters.findFirst({
//       where: { is_current: true },
//       orderBy: { start_date: 'desc' },
//     });
//     if (cur) return cur;

//     const last = await this.prisma.semesters.findFirst({
//       orderBy: { end_date: 'desc' },
//     });
//     if (!last) throw new NotFoundException('Chưa có dữ liệu học kỳ');
//     return last;
//   }

//   // ================== CLASSES ==================
//   async listMyClasses(advisorUserId: string, dto: GetAdvisorClassesDto) {
//     const today = startOfToday();

//     const assignments = await this.prisma.class_advisor_assignments.findMany({
//       where: {
//         advisor_user_id: toBigInt(advisorUserId),
//         ...(dto.include_inactive
//           ? {}
//           : {
//               from_date: { lte: today },
//               OR: [{ to_date: null }, { to_date: { gte: today } }],
//             }),
//       },
//       select: {
//         assignment_id: true,
//         from_date: true,
//         to_date: true,
//         is_primary: true,
//         classes: {
//           select: {
//             class_id: true,
//             class_code: true,
//             class_name: true,
//             major_name: true,
//             cohort_year: true,
//             status: true,
//           },
//         },
//       },
//       orderBy: [{ is_primary: 'desc' }, { from_date: 'desc' }],
//     });

//     return assignments.map((a) => ({
//       assignment_id: idToString(a.assignment_id),
//       from_date: a.from_date,
//       to_date: a.to_date,
//       is_primary: a.is_primary,
//       class: a.classes
//         ? {
//             id: idToString(a.classes.class_id),
//             class_code: a.classes.class_code,
//             class_name: a.classes.class_name,
//             major_name: a.classes.major_name,
//             cohort_year: a.classes.cohort_year,
//             status: a.classes.status,
//           }
//         : null,
//     }));
//   }

//   // ================== SEMESTERS ==================
//   async listSemesters() {
//     const list = await this.prisma.semesters.findMany({
//       select: {
//         semester_id: true,
//         semester_code: true,
//         name: true,
//         start_date: true,
//         end_date: true,
//         is_current: true,
//       },
//       orderBy: { start_date: 'desc' },
//       take: 50,
//     });

//     return list.map((s) => ({
//       id: idToString(s.semester_id),
//       semester_code: s.semester_code,
//       name: s.name,
//       start_date: s.start_date,
//       end_date: s.end_date,
//       is_current: s.is_current,
//     }));
//   }

//   // ================== DASHBOARD (Class) ==================
//   async getClassDashboard(advisorUserId: string, dto: GetAdvisorDashboardDto) {
//     await this.assertAdvisorCanAccessClass(advisorUserId, dto.class_id);

//     const classId = toBigInt(dto.class_id);
//     const semester = await this.resolveSemester(dto.semester_id);

//     const cls = await this.prisma.classes.findUnique({
//       where: { class_id: classId },
//       select: {
//         class_id: true,
//         class_code: true,
//         class_name: true,
//         major_name: true,
//         cohort_year: true,
//       },
//     });
//     if (!cls) throw new NotFoundException('Lớp không tồn tại');

//     // pagination
//     const { page: p, limit: l } = parsePaginationQuery({
//       page: dto.page,
//       limit: dto.limit,
//       maxLimit: 100,
//     });
//     const skip = (p - 1) * l;

//     const whereStudent: any = { class_id: classId };
//     if (dto.q && String(dto.q).trim()) {
//       const q = String(dto.q).trim();
//       whereStudent.OR = [
//         { student_code: { contains: q } },
//         { full_name: { contains: q } },
//       ];
//     }

//     const [students, totalStudents] = await Promise.all([
//       this.prisma.students.findMany({
//         where: whereStudent,
//         skip,
//         take: l,
//         orderBy: { student_code: 'asc' },
//         select: {
//           student_id: true,
//           student_code: true,
//           full_name: true,
//           academic_status: true,
//         },
//       }),
//       this.prisma.students.count({ where: whereStudent }),
//     ]);

//     const studentIds = students.map((s) => s.student_id);

//     const [snaps, warns] = await Promise.all([
//       this.prisma.gpa_snapshots.findMany({
//         where: {
//           class_id: classId,
//           semester_id: semester.semester_id,
//           student_id: { in: studentIds },
//         },
//         select: {
//           student_id: true,
//           gpa_semester: true,
//           gpa_cumulative: true,
//           credits_earned_semester: true,
//           credits_failed_semester: true,
//           failed_courses_count_semester: true,
//           data_status: true,
//         },
//       }),
//       this.prisma.warnings.findMany({
//         where: { class_id: classId, semester_id: semester.semester_id, student_id: { in: studentIds } },
//         select: { student_id: true, status: true },
//       }),
//     ]);

//     const snapMap = new Map<string, any>();
//     for (const s of snaps) snapMap.set(idToString(s.student_id), s);

//     const warnCountByStudent = new Map<string, number>();
//     for (const w of warns) {
//       const sid = idToString(w.student_id);
//       warnCountByStudent.set(sid, (warnCountByStudent.get(sid) ?? 0) + 1);
//     }

//     // summary toàn lớp (nhẹ nhất: lấy gpa_snapshots + warnings theo class+semester)
//     const [snapsAll, warnsAll] = await Promise.all([
//       this.prisma.gpa_snapshots.findMany({
//         where: { class_id: classId, semester_id: semester.semester_id },
//         select: { gpa_semester: true, data_status: true },
//       }),
//       this.prisma.warnings.findMany({
//         where: { class_id: classId, semester_id: semester.semester_id },
//         select: { status: true },
//       }),
//     ]);

//     const gpaVals = snapsAll
//       .filter((x) => x.data_status === 'ok')
//       .map((x) => decimalToNumber(x.gpa_semester))
//       .filter((x): x is number => typeof x === 'number');

//     const warningsByStatus: Record<string, number> = {};
//     for (const w of warnsAll) warningsByStatus[w.status] = (warningsByStatus[w.status] ?? 0) + 1;

//     const rows = students.map((st) => {
//       const sid = idToString(st.student_id);
//       const snap = snapMap.get(sid);
//       return {
//         student: {
//           id: sid,
//           student_code: st.student_code,
//           full_name: st.full_name,
//           academic_status: st.academic_status,
//         },
//         snapshot: snap
//           ? {
//               gpa_semester: decimalToNumber(snap.gpa_semester),
//               gpa_cumulative: decimalToNumber(snap.gpa_cumulative),
//               credits_earned_semester: snap.credits_earned_semester,
//               credits_failed_semester: snap.credits_failed_semester,
//               failed_courses_count_semester: snap.failed_courses_count_semester,
//               data_status: snap.data_status,
//             }
//           : {
//               gpa_semester: null,
//               gpa_cumulative: null,
//               credits_earned_semester: 0,
//               credits_failed_semester: 0,
//               failed_courses_count_semester: 0,
//               data_status: 'missing_data',
//             },
//         warnings_total: warnCountByStudent.get(sid) ?? 0,
//       };
//     });

//     return {
//       class: {
//         id: idToString(cls.class_id),
//         class_code: cls.class_code,
//         class_name: cls.class_name,
//         major_name: cls.major_name,
//         cohort_year: cls.cohort_year,
//       },
//       semester: {
//         id: idToString(semester.semester_id),
//         semester_code: semester.semester_code,
//         name: semester.name,
//         start_date: semester.start_date,
//         end_date: semester.end_date,
//         is_current: semester.is_current,
//       },
//       summary: {
//         students_total: totalStudents,
//         avg_gpa_semester: gpaVals.length ? gpaVals.reduce((a, b) => a + b, 0) / gpaVals.length : null,
//         warnings_total: warnsAll.length,
//         warnings_by_status: warningsByStatus,
//       },
//       students: buildPaginationResponse(rows, totalStudents, p, l),
//     };
//   }

//   // ================== WARNING RULES ==================
//   async listActiveWarningRules() {
//     const rules = await this.prisma.warning_rules.findMany({
//       where: { is_active: true },
//       orderBy: [{ level: 'asc' }, { rule_code: 'asc' }],
//       select: {
//         rule_id: true,
//         rule_code: true,
//         rule_name: true,
//         description: true,
//         condition_type: true,
//         operator: true,
//         threshold_value: true,
//         level: true,
//         is_active: true,
//       },
//     });

//     return rules.map((r) => ({
//       id: idToString(r.rule_id),
//       rule_code: r.rule_code,
//       rule_name: r.rule_name,
//       description: r.description,
//       condition_type: r.condition_type,
//       operator: r.operator,
//       threshold_value: decimalToNumber(r.threshold_value),
//       level: r.level ?? null,
//       is_active: r.is_active,
//     }));
//   }

//   // ================== WARNINGS LIST ==================
//   async listWarnings(
//     advisorUserId: string,
//     classId: string,
//     semesterId?: string,
//     status?: string,
//     page?: any,
//     limit?: any,
//   ) {
//     await this.assertAdvisorCanAccessClass(advisorUserId, classId);

//     const semester = await this.resolveSemester(semesterId);

//     const { page: p, limit: l } = parsePaginationQuery({
//       page,
//       limit,
//       maxLimit: 100,
//     });
//     const skip = (p - 1) * l;

//     const where: any = {
//       class_id: toBigInt(classId),
//       semester_id: semester.semester_id,
//     };
//     if (status) where.status = status as any;

//     const [items, total] = await Promise.all([
//       this.prisma.warnings.findMany({
//         where,
//         skip,
//         take: l,
//         orderBy: { created_at: 'desc' },
//         select: {
//           warning_id: true,
//           student_id: true,
//           rule_id: true,
//           detected_value: true,
//           reason_text: true,
//           status: true,
//           send_channel: true,
//           send_status: true,
//           send_error: true,
//           sent_at: true,
//           created_at: true,
//           updated_at: true,
//           students: { select: { student_code: true, full_name: true } },
//           warning_rules: { select: { rule_code: true, rule_name: true, condition_type: true, operator: true, threshold_value: true } },
//         },
//       }),
//       this.prisma.warnings.count({ where }),
//     ]);

//     const mapped = items.map((w) => ({
//       id: idToString(w.warning_id),
//       status: w.status,
//       detected_value: decimalToNumber(w.detected_value),
//       reason_text: w.reason_text,
//       send: {
//         channel: w.send_channel ?? null,
//         status: w.send_status ?? null,
//         error: w.send_error ?? null,
//         sent_at: w.sent_at ?? null,
//       },
//       student: {
//         id: idToString(w.student_id),
//         student_code: w.students?.student_code ?? null,
//         full_name: w.students?.full_name ?? null,
//       },
//       rule: {
//         id: idToString(w.rule_id),
//         rule_code: w.warning_rules?.rule_code ?? null,
//         rule_name: w.warning_rules?.rule_name ?? null,
//         condition_type: w.warning_rules?.condition_type ?? null,
//         operator: w.warning_rules?.operator ?? null,
//         threshold_value: w.warning_rules ? Number(w.warning_rules.threshold_value) : null,
//       },
//       created_at: w.created_at,
//       updated_at: w.updated_at,
//     }));

//     return buildPaginationResponse(mapped, total, p, l);
//   }

//   // ================== PREVIEW WARNINGS (FR-08) ==================
//   async previewWarnings(advisorUserId: string, dto: PreviewWarningsDto) {
//     await this.assertAdvisorCanAccessClass(advisorUserId, dto.class_id);

//     const classId = toBigInt(dto.class_id);
//     const semester = await this.resolveSemester(dto.semester_id);

//     const [students, rules] = await Promise.all([
//       this.prisma.students.findMany({
//         where: { class_id: classId },
//         select: { student_id: true, student_code: true, full_name: true, academic_status: true },
//         orderBy: { student_code: 'asc' },
//       }),
//       this.prisma.warning_rules.findMany({
//         where: { is_active: true },
//         orderBy: [{ level: 'asc' }, { rule_code: 'asc' }],
//       }),
//     ]);

//     const studentIds = students.map((s) => s.student_id);

//     const snaps = await this.prisma.gpa_snapshots.findMany({
//       where: { class_id: classId, semester_id: semester.semester_id, student_id: { in: studentIds } },
//       select: {
//         student_id: true,
//         gpa_semester: true,
//         gpa_cumulative: true,
//         failed_courses_count_semester: true,
//         credits_earned_semester: true,
//         credits_failed_semester: true,
//         data_status: true,
//       },
//     });

//     const snapMap = new Map<string, any>();
//     for (const s of snaps) snapMap.set(idToString(s.student_id), s);

//     const triggered: any[] = [];

//     for (const st of students) {
//       const sid = idToString(st.student_id);
//       const snap = snapMap.get(sid);
//       if (!snap || snap.data_status !== 'ok') continue;

//       for (const rule of rules) {
//         const th = Number(rule.threshold_value);
//         let detected: number | null = null;

//         switch (rule.condition_type) {
//           case 'GPA_SEM':
//             detected = decimalToNumber(snap.gpa_semester);
//             break;
//           case 'GPA_CUM':
//             detected = decimalToNumber(snap.gpa_cumulative);
//             break;
//           case 'FAIL_COUNT':
//             detected = Number(snap.failed_courses_count_semester ?? 0);
//             break;
//           case 'CREDITS_EARNED':
//             detected = Number(snap.credits_earned_semester ?? 0);
//             break;
//           case 'CREDITS_FAILED':
//             detected = Number(snap.credits_failed_semester ?? 0);
//             break;
//           default:
//             detected = null;
//         }

//         if (detected === null) continue;
//         if (!compare(rule.operator as Operator, detected, th)) continue;

//         triggered.push({
//           student: {
//             id: sid,
//             student_code: st.student_code,
//             full_name: st.full_name,
//             academic_status: st.academic_status,
//           },
//           rule: {
//             id: idToString(rule.rule_id),
//             rule_code: rule.rule_code,
//             rule_name: rule.rule_name,
//             condition_type: rule.condition_type,
//             operator: rule.operator,
//             threshold_value: Number(rule.threshold_value),
//             level: rule.level ?? null,
//           },
//           detected_value: detected,
//           reason_text: `[${rule.rule_code}] ${rule.rule_name}`,
//         });
//       }
//     }

//     return {
//       class_id: dto.class_id,
//       semester: { id: idToString(semester.semester_id), semester_code: semester.semester_code, name: semester.name },
//       triggered_total: triggered.length,
//       triggered,
//     };
//   }

//   // ================== GENERATE WARNINGS (Draft/Sent) ==================
//   async generateWarnings(advisorUserId: string, dto: GenerateWarningsDto) {
//     if (dto.create_status === 'Sent' && !dto.send_channel) {
//       throw new BadRequestException('create_status=Sent thì phải có send_channel');
//     }

//     const preview = await this.previewWarnings(advisorUserId, {
//       class_id: dto.class_id,
//       semester_id: dto.semester_id,
//     });

//     const advisorId = toBigInt(advisorUserId);
//     const classId = toBigInt(dto.class_id);
//     const semesterId = toBigInt(preview.semester.id);

//     // audit
//     await this.prisma.audit_logs.create({
//       data: {
//         user_id: advisorId,
//         action: 'GENERATE_WARNING',
//         object_type: 'class_semester',
//         object_id: classId,
//         details: {
//           class_id: dto.class_id,
//           semester_id: preview.semester.id,
//           create_status: dto.create_status,
//           send_channel: dto.send_channel ?? null,
//           triggered_total: preview.triggered_total,
//         } as any,
//       },
//     });

//     const touched: any[] = [];

//     for (const item of preview.triggered) {
//       const studentId = toBigInt(item.student.id);
//       const ruleId = toBigInt(item.rule.id);

//       const w = await this.prisma.warnings.upsert({
//         where: {
//           student_id_semester_id_rule_id: {
//             student_id: studentId,
//             semester_id: semesterId,
//             rule_id: ruleId,
//           },
//         },
//         create: {
//           student_id: studentId,
//           class_id: classId,
//           semester_id: semesterId,
//           rule_id: ruleId,
//           detected_value: item.detected_value,
//           reason_text: item.reason_text,
//           status: dto.create_status,
//           send_channel: dto.create_status === 'Sent' ? (dto.send_channel as any) : null,
//           created_by: advisorId,
//         },
//         update: {
//           detected_value: item.detected_value,
//           reason_text: item.reason_text,
//           updated_at: new Date(),
//           // nếu muốn: nếu đang Draft mà chọn Sent => set sang Sent
//           ...(dto.create_status === 'Sent'
//             ? { status: 'Sent' as any, send_channel: dto.send_channel as any }
//             : {}),
//         },
//         select: { warning_id: true, status: true },
//       });

//       touched.push(w);
//     }

//     // nếu Sent => thực hiện send (demo)
//     let sendResult: any = null;
//     if (dto.create_status === 'Sent') {
//       sendResult = await this.sendWarnings(advisorUserId, {
//         warning_ids: touched.map((x) => idToString(x.warning_id)),
//         channel: dto.send_channel!,
//       });
//     }

//     return {
//       message: dto.create_status === 'Draft' ? 'Đã tạo cảnh báo (Draft)' : 'Đã tạo & gửi cảnh báo',
//       preview: { triggered_total: preview.triggered_total },
//       warnings_total_touched: touched.length,
//       sent: sendResult,
//     };
//   }

//   // ================== SEND WARNINGS (demo sender) ==================
//   async sendWarnings(advisorUserId: string, dto: SendWarningsDto) {
//     const channel = (dto.channel ?? 'in_app') as any;

//     const warnings = await this.prisma.warnings.findMany({
//       where: { warning_id: { in: dto.warning_ids.map(toBigInt) } },
//       select: { warning_id: true, class_id: true, status: true },
//     });

//     if (warnings.length !== dto.warning_ids.length) {
//       throw new NotFoundException('Một số warning_id không tồn tại');
//     }

//     for (const w of warnings) {
//       await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));
//     }

//     const now = new Date();
//     const results: any[] = [];

//     for (const w of warnings) {
//       const canSend = w.status === 'Draft' || w.status === 'SendFailed' || w.status === 'Sent';
//       if (!canSend) continue;

//       try {
//         // TODO: thay bằng mailer / in-app thật
//         const ok = true;

//         if (ok) {
//           await this.prisma.warnings.update({
//             where: { warning_id: w.warning_id },
//             data: {
//               status: 'Sent',
//               send_channel: channel,
//               send_status: 'sent',
//               send_error: null,
//               sent_at: now,
//               updated_at: now,
//             },
//           });
//           results.push({ warning_id: idToString(w.warning_id), status: 'sent' });
//         }
//       } catch (e: any) {
//         await this.prisma.warnings.update({
//           where: { warning_id: w.warning_id },
//           data: {
//             status: 'SendFailed',
//             send_channel: channel,
//             send_status: 'failed',
//             send_error: String(e?.message ?? 'send failed'),
//             updated_at: now,
//           },
//         });
//         results.push({ warning_id: idToString(w.warning_id), status: 'failed' });
//       }
//     }

//     await this.prisma.audit_logs.create({
//       data: {
//         user_id: toBigInt(advisorUserId),
//         action: 'GENERATE_WARNING',
//         object_type: 'send_warnings',
//         object_id: null,
//         details: { attempted: dto.warning_ids.length, channel, results } as any,
//       },
//     });

//     return { attempted: dto.warning_ids.length, results };
//   }

//   // ================== UPDATE WARNING STATUS ==================
//   async updateWarningStatus(advisorUserId: string, warningId: string, dto: UpdateWarningStatusDto) {
//     const w = await this.prisma.warnings.findUnique({
//       where: { warning_id: toBigInt(warningId) },
//       select: { warning_id: true, class_id: true },
//     });
//     if (!w) throw new NotFoundException('Warning không tồn tại');

//     await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));

//     const updated = await this.prisma.warnings.update({
//       where: { warning_id: w.warning_id },
//       data: { status: dto.status as any, updated_at: new Date() },
//       select: { warning_id: true, status: true, updated_at: true },
//     });

//     return {
//       message: 'Cập nhật trạng thái cảnh báo thành công',
//       warning: {
//         id: idToString(updated.warning_id),
//         status: updated.status,
//         updated_at: updated.updated_at,
//       },
//     };
//   }

//   // ================== STUDENT DETAIL ==================
//   async getStudentDetail(advisorUserId: string, studentId: string, dto: GetAdvisorStudentDetailDto) {
//     await this.assertAdvisorCanAccessStudent(advisorUserId, studentId);

//     const sid = toBigInt(studentId);
//     const semester = await this.resolveSemester(dto.semester_id);

//     const student = await this.prisma.students.findUnique({
//       where: { student_id: sid },
//       select: {
//         student_id: true,
//         student_code: true,
//         full_name: true,
//         email: true,
//         phone: true,
//         academic_status: true,
//         class_id: true,
//         classes: { select: { class_code: true, class_name: true, major_name: true, cohort_year: true } },
//       },
//     });
//     if (!student) throw new NotFoundException('Sinh viên không tồn tại');

//     const snapshot = await this.prisma.gpa_snapshots.findUnique({
//       where: {
//         student_id_semester_id: { student_id: sid, semester_id: semester.semester_id },
//       },
//     });

//     const [warnings, notes] = await Promise.all([
//       this.prisma.warnings.findMany({
//         where: { student_id: sid, semester_id: semester.semester_id },
//         orderBy: { created_at: 'desc' },
//         select: {
//           warning_id: true,
//           status: true,
//           detected_value: true,
//           reason_text: true,
//           sent_at: true,
//           send_channel: true,
//           send_status: true,
//           send_error: true,
//           warning_rules: { select: { rule_code: true, rule_name: true, condition_type: true, operator: true, threshold_value: true } },
//         },
//       }),
//       this.prisma.advisory_notes.findMany({
//         where: { student_id: sid },
//         orderBy: { created_at: 'desc' },
//         take: 30,
//         select: {
//           note_id: true,
//           content: true,
//           counseling_date: true,
//           handling_status: true,
//           warning_id: true,
//           attachment_url: true,
//           created_at: true,
//           users: { select: { user_id: true, full_name: true } },
//         },
//       }),
//     ]);

//     const includeGrades = dto.include_grades ?? true;
//     const grades = includeGrades
//       ? await this.prisma.grades.findMany({
//           where: { student_id: sid, semester_id: semester.semester_id },
//           orderBy: [{ course_id: 'asc' }, { attempt_no: 'desc' }],
//           select: {
//             grade_id: true,
//             attempt_no: true,
//             score_10: true,
//             letter_grade: true,
//             score_4: true,
//             is_pass: true,
//             note: true,
//             updated_at: true,
//             courses: { select: { course_code: true, course_name: true, credits: true, course_type: true } },
//           },
//         })
//       : [];

//     return {
//       student: {
//         id: idToString(student.student_id),
//         student_code: student.student_code,
//         full_name: student.full_name,
//         email: student.email ?? null,
//         phone: student.phone ?? null,
//         academic_status: student.academic_status,
//         class: student.classes
//           ? {
//               id: idToString(student.class_id),
//               class_code: student.classes.class_code,
//               class_name: student.classes.class_name,
//               major_name: student.classes.major_name,
//               cohort_year: student.classes.cohort_year,
//             }
//           : null,
//       },
//       semester: {
//         id: idToString(semester.semester_id),
//         semester_code: semester.semester_code,
//         name: semester.name,
//       },
//       snapshot: snapshot
//         ? {
//             gpa_semester: decimalToNumber(snapshot.gpa_semester),
//             gpa_cumulative: decimalToNumber(snapshot.gpa_cumulative),
//             credits_earned_semester: snapshot.credits_earned_semester,
//             credits_failed_semester: snapshot.credits_failed_semester,
//             failed_courses_count_semester: snapshot.failed_courses_count_semester,
//             data_status: snapshot.data_status,
//           }
//         : {
//             gpa_semester: null,
//             gpa_cumulative: null,
//             credits_earned_semester: 0,
//             credits_failed_semester: 0,
//             failed_courses_count_semester: 0,
//             data_status: 'missing_data',
//           },
//       warnings: warnings.map((w) => ({
//         id: idToString(w.warning_id),
//         status: w.status,
//         detected_value: decimalToNumber(w.detected_value),
//         reason_text: w.reason_text,
//         send: {
//           channel: w.send_channel ?? null,
//           status: w.send_status ?? null,
//           error: w.send_error ?? null,
//           sent_at: w.sent_at ?? null,
//         },
//         rule: w.warning_rules
//           ? {
//               rule_code: w.warning_rules.rule_code,
//               rule_name: w.warning_rules.rule_name,
//               condition_type: w.warning_rules.condition_type,
//               operator: w.warning_rules.operator,
//               threshold_value: Number(w.warning_rules.threshold_value),
//             }
//           : null,
//       })),
//       notes: notes.map((n) => ({
//         id: idToString(n.note_id),
//         content: n.content,
//         counseling_date: n.counseling_date,
//         handling_status: n.handling_status,
//         warning_id: n.warning_id ? idToString(n.warning_id) : null,
//         attachment_url: n.attachment_url ?? null,
//         advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
//         created_at: n.created_at,
//       })),
//       grades: includeGrades
//         ? grades.map((g) => ({
//             id: idToString(g.grade_id),
//             attempt_no: g.attempt_no,
//             score_10: decimalToNumber(g.score_10),
//             letter_grade: g.letter_grade,
//             score_4: decimalToNumber(g.score_4),
//             is_pass: g.is_pass,
//             note: g.note,
//             updated_at: g.updated_at,
//             course: g.courses
//               ? {
//                   course_code: g.courses.course_code,
//                   course_name: g.courses.course_name,
//                   credits: g.courses.credits,
//                   course_type: g.courses.course_type,
//                 }
//               : null,
//           }))
//         : null,
//     };
//   }

//   // ================== NOTES ==================
//   async createAdvisoryNote(advisorUserId: string, dto: CreateAdvisoryNoteDto) {
//     await this.assertAdvisorCanAccessStudent(advisorUserId, dto.student_id);

//     const student = await this.prisma.students.findUnique({
//       where: { student_id: toBigInt(dto.student_id) },
//       select: { class_id: true },
//     });
//     if (!student) throw new NotFoundException('Sinh viên không tồn tại');

//     const note = await this.prisma.advisory_notes.create({
//       data: {
//         student_id: toBigInt(dto.student_id),
//         class_id: student.class_id,
//         advisor_user_id: toBigInt(advisorUserId),
//         warning_id: dto.warning_id ? toBigInt(dto.warning_id) : null,
//         content: dto.content,
//         counseling_date: dto.counseling_date ? new Date(dto.counseling_date) : null,
//         handling_status: (dto.handling_status as any) ?? 'not_contacted',
//         attachment_url: dto.attachment_url ?? null,
//       },
//       select: {
//         note_id: true,
//         content: true,
//         counseling_date: true,
//         handling_status: true,
//         attachment_url: true,
//         warning_id: true,
//         created_at: true,
//       },
//     });

//     return {
//       message: 'Tạo ghi chú tư vấn thành công',
//       note: {
//         id: idToString(note.note_id),
//         content: note.content,
//         counseling_date: note.counseling_date,
//         handling_status: note.handling_status,
//         attachment_url: note.attachment_url ?? null,
//         warning_id: note.warning_id ? idToString(note.warning_id) : null,
//         created_at: note.created_at,
//       },
//     };
//   }

//   async listNotesByStudent(advisorUserId: string, studentId: string) {
//     await this.assertAdvisorCanAccessStudent(advisorUserId, studentId);

//     const notes = await this.prisma.advisory_notes.findMany({
//       where: { student_id: toBigInt(studentId) },
//       orderBy: { created_at: 'desc' },
//       take: 50,
//       select: {
//         note_id: true,
//         content: true,
//         counseling_date: true,
//         handling_status: true,
//         attachment_url: true,
//         warning_id: true,
//         created_at: true,
//         users: { select: { user_id: true, full_name: true } },
//       },
//     });

//     return notes.map((n) => ({
//       id: idToString(n.note_id),
//       content: n.content,
//       counseling_date: n.counseling_date,
//       handling_status: n.handling_status,
//       attachment_url: n.attachment_url ?? null,
//       warning_id: n.warning_id ? idToString(n.warning_id) : null,
//       advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
//       created_at: n.created_at,
//     }));
//   }

// }


import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  buildPaginationResponse,
  parsePaginationQuery,
} from 'src/common/helpers/pagination.helper';

import { GetAdvisorClassesDto } from './dto/get-advisor-classes.dto';
import { GetAdvisorDashboardDto } from './dto/get-advisor-dashboard.dto';
import { PreviewWarningsDto } from './dto/preview-warnings.dto';
import { GenerateWarningsDto } from './dto/generate-warnings.dto';
import { SendWarningsDto } from './dto/send-warnings.dto';
import { UpdateWarningStatusDto } from './dto/update-warning-status.dto';
import { CreateAdvisoryNoteDto } from './dto/create-advisory-note.dto';
import { GetAdvisorStudentDetailDto } from './dto/get-advisor-student-detail.dto';

// ====== DTO MỚI (bạn đã có theo gợi ý) ======
import { BulkWarningStatusDto } from './dto/bulk-warning-status.dto';
import { UpdateAdvisoryNoteDto } from 'src/advisor/dto/update-advisory-note.dto';

function toBigInt(id: string | number | bigint): bigint {
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  if (typeof id === 'string') return BigInt(id);
  throw new Error('Invalid id');
}
function idToString(v: any): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return String(v ?? '');
}
function decimalToNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
type Operator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';
function compare(operator: Operator, value: number, threshold: number): boolean {
  switch (operator) {
    case 'LT':
      return value < threshold;
    case 'LTE':
      return value <= threshold;
    case 'GT':
      return value > threshold;
    case 'GTE':
      return value >= threshold;
    case 'EQ':
      return value === threshold;
    case 'NEQ':
      return value !== threshold;
    default:
      return false;
  }
}

@Injectable()
export class AdvisorService {
  prisma = new PrismaClient();

  // ====== ACCESS CHECK ======
  private async assertAdvisorCanAccessClass(advisorUserId: string, classId: string) {
    const today = startOfToday();
    const assignment = await this.prisma.class_advisor_assignments.findFirst({
      where: {
        advisor_user_id: toBigInt(advisorUserId),
        class_id: toBigInt(classId),
        from_date: { lte: today },
        OR: [{ to_date: null }, { to_date: { gte: today } }],
      },
      select: { assignment_id: true },
    });

    if (!assignment) {
      // nếu bạn muốn admin bypass ở service, có thể check req.user.role ở controller
      throw new ForbiddenException('Bạn không có quyền truy cập lớp này');
    }
  }

  private async assertAdvisorCanAccessStudent(advisorUserId: string, studentId: string) {
    const st = await this.prisma.students.findUnique({
      where: { student_id: toBigInt(studentId) },
      select: { class_id: true },
    });
    if (!st) throw new NotFoundException('Sinh viên không tồn tại');
    await this.assertAdvisorCanAccessClass(advisorUserId, String(st.class_id));
  }

  private async resolveSemester(semesterId?: string) {
    if (semesterId) {
      const s = await this.prisma.semesters.findUnique({
        where: { semester_id: toBigInt(semesterId) },
      });
      if (!s) throw new NotFoundException('Học kỳ không tồn tại');
      return s;
    }

    const cur = await this.prisma.semesters.findFirst({
      where: { is_current: true },
      orderBy: { start_date: 'desc' },
    });
    if (cur) return cur;

    const last = await this.prisma.semesters.findFirst({
      orderBy: { end_date: 'desc' },
    });
    if (!last) throw new NotFoundException('Chưa có dữ liệu học kỳ');
    return last;
  }

  // ================== CLASSES ==================
  async listMyClasses(advisorUserId: string, dto: GetAdvisorClassesDto) {
    const today = startOfToday();

    const assignments = await this.prisma.class_advisor_assignments.findMany({
      where: {
        advisor_user_id: toBigInt(advisorUserId),
        ...(dto.include_inactive
          ? {}
          : {
              from_date: { lte: today },
              OR: [{ to_date: null }, { to_date: { gte: today } }],
            }),
      },
      select: {
        assignment_id: true,
        from_date: true,
        to_date: true,
        is_primary: true,
        classes: {
          select: {
            class_id: true,
            class_code: true,
            class_name: true,
            major_name: true,
            cohort_year: true,
            status: true,
          },
        },
      },
      orderBy: [{ is_primary: 'desc' }, { from_date: 'desc' }],
    });

    return assignments.map((a) => ({
      assignment_id: idToString(a.assignment_id),
      from_date: a.from_date,
      to_date: a.to_date,
      is_primary: a.is_primary,
      class: a.classes
        ? {
            id: idToString(a.classes.class_id),
            class_code: a.classes.class_code,
            class_name: a.classes.class_name,
            major_name: a.classes.major_name,
            cohort_year: a.classes.cohort_year,
            status: a.classes.status,
          }
        : null,
    }));
  }

  // ================== SEMESTERS ==================
  async listSemesters() {
    const list = await this.prisma.semesters.findMany({
      select: {
        semester_id: true,
        semester_code: true,
        name: true,
        start_date: true,
        end_date: true,
        is_current: true,
      },
      orderBy: { start_date: 'desc' },
      take: 50,
    });

    return list.map((s) => ({
      id: idToString(s.semester_id),
      semester_code: s.semester_code,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      is_current: s.is_current,
    }));
  }

  // ================== DASHBOARD (Class) ==================
  async getClassDashboard(advisorUserId: string, dto: GetAdvisorDashboardDto) {
    await this.assertAdvisorCanAccessClass(advisorUserId, dto.class_id);

    const classId = toBigInt(dto.class_id);
    const semester = await this.resolveSemester(dto.semester_id);

    const cls = await this.prisma.classes.findUnique({
      where: { class_id: classId },
      select: {
        class_id: true,
        class_code: true,
        class_name: true,
        major_name: true,
        cohort_year: true,
      },
    });
    if (!cls) throw new NotFoundException('Lớp không tồn tại');

    // pagination
    const { page: p, limit: l } = parsePaginationQuery({
      page: dto.page,
      limit: dto.limit,
      maxLimit: 100,
    });
    const skip = (p - 1) * l;

    const whereStudent: any = { class_id: classId };
    if (dto.q && String(dto.q).trim()) {
      const q = String(dto.q).trim();
      whereStudent.OR = [
        { student_code: { contains: q } },
        { full_name: { contains: q } },
      ];
    }

    const [students, totalStudents] = await Promise.all([
      this.prisma.students.findMany({
        where: whereStudent,
        skip,
        take: l,
        orderBy: { student_code: 'asc' },
        select: {
          student_id: true,
          student_code: true,
          full_name: true,
          academic_status: true,
        },
      }),
      this.prisma.students.count({ where: whereStudent }),
    ]);

    const studentIds = students.map((s) => s.student_id);

    const [snaps, warns] = await Promise.all([
      this.prisma.gpa_snapshots.findMany({
        where: {
          class_id: classId,
          semester_id: semester.semester_id,
          student_id: { in: studentIds },
        },
        select: {
          student_id: true,
          gpa_semester: true,
          gpa_cumulative: true,
          credits_earned_semester: true,
          credits_failed_semester: true,
          failed_courses_count_semester: true,
          data_status: true,
        },
      }),
      this.prisma.warnings.findMany({
        where: {
          class_id: classId,
          semester_id: semester.semester_id,
          student_id: { in: studentIds },
        },
        select: { student_id: true, status: true },
      }),
    ]);

    const snapMap = new Map<string, any>();
    for (const s of snaps) snapMap.set(idToString(s.student_id), s);

    const warnCountByStudent = new Map<string, number>();
    for (const w of warns) {
      const sid = idToString(w.student_id);
      warnCountByStudent.set(sid, (warnCountByStudent.get(sid) ?? 0) + 1);
    }

    // summary toàn lớp
    const [snapsAll, warnsAll] = await Promise.all([
      this.prisma.gpa_snapshots.findMany({
        where: { class_id: classId, semester_id: semester.semester_id },
        select: { gpa_semester: true, data_status: true },
      }),
      this.prisma.warnings.findMany({
        where: { class_id: classId, semester_id: semester.semester_id },
        select: { status: true },
      }),
    ]);

    const gpaVals = snapsAll
      .filter((x) => x.data_status === 'ok')
      .map((x) => decimalToNumber(x.gpa_semester))
      .filter((x): x is number => typeof x === 'number');

    const warningsByStatus: Record<string, number> = {};
    for (const w of warnsAll)
      warningsByStatus[w.status] = (warningsByStatus[w.status] ?? 0) + 1;

    const rows = students.map((st) => {
      const sid = idToString(st.student_id);
      const snap = snapMap.get(sid);
      return {
        student: {
          id: sid,
          student_code: st.student_code,
          full_name: st.full_name,
          academic_status: st.academic_status,
        },
        snapshot: snap
          ? {
              gpa_semester: decimalToNumber(snap.gpa_semester),
              gpa_cumulative: decimalToNumber(snap.gpa_cumulative),
              credits_earned_semester: snap.credits_earned_semester,
              credits_failed_semester: snap.credits_failed_semester,
              failed_courses_count_semester: snap.failed_courses_count_semester,
              data_status: snap.data_status,
            }
          : {
              gpa_semester: null,
              gpa_cumulative: null,
              credits_earned_semester: 0,
              credits_failed_semester: 0,
              failed_courses_count_semester: 0,
              data_status: 'missing_data',
            },
        warnings_total: warnCountByStudent.get(sid) ?? 0,
      };
    });

    return {
      class: {
        id: idToString(cls.class_id),
        class_code: cls.class_code,
        class_name: cls.class_name,
        major_name: cls.major_name,
        cohort_year: cls.cohort_year,
      },
      semester: {
        id: idToString(semester.semester_id),
        semester_code: semester.semester_code,
        name: semester.name,
        start_date: semester.start_date,
        end_date: semester.end_date,
        is_current: semester.is_current,
      },
      summary: {
        students_total: totalStudents,
        avg_gpa_semester: gpaVals.length
          ? gpaVals.reduce((a, b) => a + b, 0) / gpaVals.length
          : null,
        warnings_total: warnsAll.length,
        warnings_by_status: warningsByStatus,
      },
      students: buildPaginationResponse(rows, totalStudents, p, l),
    };
  }

  // ================== WARNING RULES ==================
  async listActiveWarningRules() {
    const rules = await this.prisma.warning_rules.findMany({
      where: { is_active: true },
      orderBy: [{ level: 'asc' }, { rule_code: 'asc' }],
      select: {
        rule_id: true,
        rule_code: true,
        rule_name: true,
        description: true,
        condition_type: true,
        operator: true,
        threshold_value: true,
        level: true,
        is_active: true,
      },
    });

    return rules.map((r) => ({
      id: idToString(r.rule_id),
      rule_code: r.rule_code,
      rule_name: r.rule_name,
      description: r.description,
      condition_type: r.condition_type,
      operator: r.operator,
      threshold_value: decimalToNumber(r.threshold_value),
      level: r.level ?? null,
      is_active: r.is_active,
    }));
  }

  // ================== WARNINGS LIST ==================
  async listWarnings(
    advisorUserId: string,
    classId: string,
    semesterId?: string,
    status?: string,
    page?: any,
    limit?: any,
  ) {
    await this.assertAdvisorCanAccessClass(advisorUserId, classId);

    const semester = await this.resolveSemester(semesterId);

    const { page: p, limit: l } = parsePaginationQuery({
      page,
      limit,
      maxLimit: 100,
    });
    const skip = (p - 1) * l;

    const where: any = {
      class_id: toBigInt(classId),
      semester_id: semester.semester_id,
    };
    if (status) where.status = status as any;

    const [items, total] = await Promise.all([
      this.prisma.warnings.findMany({
        where,
        skip,
        take: l,
        orderBy: { created_at: 'desc' },
        select: {
          warning_id: true,
          student_id: true,
          rule_id: true,
          detected_value: true,
          reason_text: true,
          status: true,
          send_channel: true,
          send_status: true,
          send_error: true,
          sent_at: true,
          created_at: true,
          updated_at: true,
          students: { select: { student_code: true, full_name: true } },
          warning_rules: {
            select: {
              rule_code: true,
              rule_name: true,
              condition_type: true,
              operator: true,
              threshold_value: true,
            },
          },
        },
      }),
      this.prisma.warnings.count({ where }),
    ]);

    const mapped = items.map((w) => ({
      id: idToString(w.warning_id),
      status: w.status,
      detected_value: decimalToNumber(w.detected_value),
      reason_text: w.reason_text,
      send: {
        channel: w.send_channel ?? null,
        status: w.send_status ?? null,
        error: w.send_error ?? null,
        sent_at: w.sent_at ?? null,
      },
      student: {
        id: idToString(w.student_id),
        student_code: w.students?.student_code ?? null,
        full_name: w.students?.full_name ?? null,
      },
      rule: {
        id: idToString(w.rule_id),
        rule_code: w.warning_rules?.rule_code ?? null,
        rule_name: w.warning_rules?.rule_name ?? null,
        condition_type: w.warning_rules?.condition_type ?? null,
        operator: w.warning_rules?.operator ?? null,
        threshold_value: w.warning_rules ? Number(w.warning_rules.threshold_value) : null,
      },
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));

    return buildPaginationResponse(mapped, total, p, l);
  }

  // ================== PREVIEW WARNINGS (FR-08) ==================
  async previewWarnings(advisorUserId: string, dto: PreviewWarningsDto) {
    await this.assertAdvisorCanAccessClass(advisorUserId, dto.class_id);

    const classId = toBigInt(dto.class_id);
    const semester = await this.resolveSemester(dto.semester_id);

    const [students, rules] = await Promise.all([
      this.prisma.students.findMany({
        where: { class_id: classId },
        select: {
          student_id: true,
          student_code: true,
          full_name: true,
          academic_status: true,
        },
        orderBy: { student_code: 'asc' },
      }),
      this.prisma.warning_rules.findMany({
        where: { is_active: true },
        orderBy: [{ level: 'asc' }, { rule_code: 'asc' }],
      }),
    ]);

    const studentIds = students.map((s) => s.student_id);

    const snaps = await this.prisma.gpa_snapshots.findMany({
      where: {
        class_id: classId,
        semester_id: semester.semester_id,
        student_id: { in: studentIds },
      },
      select: {
        student_id: true,
        gpa_semester: true,
        gpa_cumulative: true,
        failed_courses_count_semester: true,
        credits_earned_semester: true,
        credits_failed_semester: true,
        data_status: true,
      },
    });

    const snapMap = new Map<string, any>();
    for (const s of snaps) snapMap.set(idToString(s.student_id), s);

    const triggered: any[] = [];

    for (const st of students) {
      const sid = idToString(st.student_id);
      const snap = snapMap.get(sid);
      if (!snap || snap.data_status !== 'ok') continue;

      for (const rule of rules) {
        const th = Number(rule.threshold_value);
        let detected: number | null = null;

        switch (rule.condition_type) {
          case 'GPA_SEM':
            detected = decimalToNumber(snap.gpa_semester);
            break;
          case 'GPA_CUM':
            detected = decimalToNumber(snap.gpa_cumulative);
            break;
          case 'FAIL_COUNT':
            detected = Number(snap.failed_courses_count_semester ?? 0);
            break;
          case 'CREDITS_EARNED':
            detected = Number(snap.credits_earned_semester ?? 0);
            break;
          case 'CREDITS_FAILED':
            detected = Number(snap.credits_failed_semester ?? 0);
            break;
          default:
            detected = null;
        }

        if (detected === null) continue;
        if (!compare(rule.operator as Operator, detected, th)) continue;

        triggered.push({
          student: {
            id: sid,
            student_code: st.student_code,
            full_name: st.full_name,
            academic_status: st.academic_status,
          },
          rule: {
            id: idToString(rule.rule_id),
            rule_code: rule.rule_code,
            rule_name: rule.rule_name,
            condition_type: rule.condition_type,
            operator: rule.operator,
            threshold_value: Number(rule.threshold_value),
            level: rule.level ?? null,
          },
          detected_value: detected,
          reason_text: `[${rule.rule_code}] ${rule.rule_name}`,
        });
      }
    }

    return {
      class_id: dto.class_id,
      semester: {
        id: idToString(semester.semester_id),
        semester_code: semester.semester_code,
        name: semester.name,
      },
      triggered_total: triggered.length,
      triggered,
    };
  }

  // ================== GENERATE WARNINGS (Draft/Sent) ==================
  async generateWarnings(advisorUserId: string, dto: GenerateWarningsDto) {
    if (dto.create_status === 'Sent' && !dto.send_channel) {
      throw new BadRequestException('create_status=Sent thì phải có send_channel');
    }

    const preview = await this.previewWarnings(advisorUserId, {
      class_id: dto.class_id,
      semester_id: dto.semester_id,
    });

    const advisorId = toBigInt(advisorUserId);
    const classId = toBigInt(dto.class_id);
    const semesterId = toBigInt(preview.semester.id);

    // audit
    await this.prisma.audit_logs.create({
      data: {
        user_id: advisorId,
        action: 'GENERATE_WARNING',
        object_type: 'class_semester',
        object_id: classId,
        details: {
          class_id: dto.class_id,
          semester_id: preview.semester.id,
          create_status: dto.create_status,
          send_channel: dto.send_channel ?? null,
          triggered_total: preview.triggered_total,
        } as any,
      },
    });

    const touched: any[] = [];

    for (const item of preview.triggered) {
      const studentId = toBigInt(item.student.id);
      const ruleId = toBigInt(item.rule.id);

      const w = await this.prisma.warnings.upsert({
        where: {
          student_id_semester_id_rule_id: {
            student_id: studentId,
            semester_id: semesterId,
            rule_id: ruleId,
          },
        },
        create: {
          student_id: studentId,
          class_id: classId,
          semester_id: semesterId,
          rule_id: ruleId,
          detected_value: item.detected_value,
          reason_text: item.reason_text,
          status: dto.create_status,
          send_channel:
            dto.create_status === 'Sent' ? (dto.send_channel as any) : null,
          created_by: advisorId,
        },
        update: {
          detected_value: item.detected_value,
          reason_text: item.reason_text,
          updated_at: new Date(),
          ...(dto.create_status === 'Sent'
            ? { status: 'Sent' as any, send_channel: dto.send_channel as any }
            : {}),
        },
        select: { warning_id: true, status: true },
      });

      touched.push(w);
    }

    // nếu Sent => thực hiện send (demo)
    let sendResult: any = null;
    if (dto.create_status === 'Sent') {
      sendResult = await this.sendWarnings(advisorUserId, {
        warning_ids: touched.map((x) => idToString(x.warning_id)),
        channel: dto.send_channel!,
      });
    }

    return {
      message:
        dto.create_status === 'Draft'
          ? 'Đã tạo cảnh báo (Draft)'
          : 'Đã tạo & gửi cảnh báo',
      preview: { triggered_total: preview.triggered_total },
      warnings_total_touched: touched.length,
      sent: sendResult,
    };
  }

  // ================== SEND WARNINGS (demo sender) ==================
  async sendWarnings(advisorUserId: string, dto: SendWarningsDto) {
    const channel = (dto.channel ?? 'in_app') as any;

    const warnings = await this.prisma.warnings.findMany({
      where: { warning_id: { in: dto.warning_ids.map(toBigInt) } },
      select: { warning_id: true, class_id: true, status: true },
    });

    if (warnings.length !== dto.warning_ids.length) {
      throw new NotFoundException('Một số warning_id không tồn tại');
    }

    for (const w of warnings) {
      await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));
    }

    const now = new Date();
    const results: any[] = [];

    for (const w of warnings) {
      const canSend =
        w.status === 'Draft' || w.status === 'SendFailed' || w.status === 'Sent';
      if (!canSend) continue;

      try {
        // TODO: thay bằng mailer / in-app thật
        const ok = true;

        if (ok) {
          await this.prisma.warnings.update({
            where: { warning_id: w.warning_id },
            data: {
              status: 'Sent',
              send_channel: channel,
              send_status: 'sent',
              send_error: null,
              sent_at: now,
              updated_at: now,
            },
          });
          results.push({ warning_id: idToString(w.warning_id), status: 'sent' });
        }
      } catch (e: any) {
        await this.prisma.warnings.update({
          where: { warning_id: w.warning_id },
          data: {
            status: 'SendFailed',
            send_channel: channel,
            send_status: 'failed',
            send_error: String(e?.message ?? 'send failed'),
            updated_at: now,
          },
        });
        results.push({ warning_id: idToString(w.warning_id), status: 'failed' });
      }
    }

    await this.prisma.audit_logs.create({
      data: {
        user_id: toBigInt(advisorUserId),
        action: 'GENERATE_WARNING',
        object_type: 'send_warnings',
        object_id: null,
        details: { attempted: dto.warning_ids.length, channel, results } as any,
      },
    });

    return { attempted: dto.warning_ids.length, results };
  }

  // ================== UPDATE WARNING STATUS ==================
  async updateWarningStatus(
    advisorUserId: string,
    warningId: string,
    dto: UpdateWarningStatusDto,
  ) {
    const w = await this.prisma.warnings.findUnique({
      where: { warning_id: toBigInt(warningId) },
      select: { warning_id: true, class_id: true },
    });
    if (!w) throw new NotFoundException('Warning không tồn tại');

    await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));

    const updated = await this.prisma.warnings.update({
      where: { warning_id: w.warning_id },
      data: { status: dto.status as any, updated_at: new Date() },
      select: { warning_id: true, status: true, updated_at: true },
    });

    return {
      message: 'Cập nhật trạng thái cảnh báo thành công',
      warning: {
        id: idToString(updated.warning_id),
        status: updated.status,
        updated_at: updated.updated_at,
      },
    };
  }

  // ================== STUDENT DETAIL ==================
  async getStudentDetail(
    advisorUserId: string,
    studentId: string,
    dto: GetAdvisorStudentDetailDto,
  ) {
    await this.assertAdvisorCanAccessStudent(advisorUserId, studentId);

    const sid = toBigInt(studentId);
    const semester = await this.resolveSemester(dto.semester_id);

    const student = await this.prisma.students.findUnique({
      where: { student_id: sid },
      select: {
        student_id: true,
        student_code: true,
        full_name: true,
        email: true,
        phone: true,
        academic_status: true,
        class_id: true,
        classes: {
          select: {
            class_code: true,
            class_name: true,
            major_name: true,
            cohort_year: true,
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const snapshot = await this.prisma.gpa_snapshots.findUnique({
      where: {
        student_id_semester_id: { student_id: sid, semester_id: semester.semester_id },
      },
    });

    const [warnings, notes] = await Promise.all([
      this.prisma.warnings.findMany({
        where: { student_id: sid, semester_id: semester.semester_id },
        orderBy: { created_at: 'desc' },
        select: {
          warning_id: true,
          status: true,
          detected_value: true,
          reason_text: true,
          sent_at: true,
          send_channel: true,
          send_status: true,
          send_error: true,
          warning_rules: {
            select: {
              rule_code: true,
              rule_name: true,
              condition_type: true,
              operator: true,
              threshold_value: true,
            },
          },
        },
      }),
      this.prisma.advisory_notes.findMany({
        where: { student_id: sid },
        orderBy: { created_at: 'desc' },
        take: 30,
        select: {
          note_id: true,
          content: true,
          counseling_date: true,
          handling_status: true,
          warning_id: true,
          attachment_url: true,
          created_at: true,
          users: { select: { user_id: true, full_name: true } },
        },
      }),
    ]);

    const includeGrades = dto.include_grades ?? true;
    const grades = includeGrades
      ? await this.prisma.grades.findMany({
          where: { student_id: sid, semester_id: semester.semester_id },
          orderBy: [{ course_id: 'asc' }, { attempt_no: 'desc' }],
          select: {
            grade_id: true,
            attempt_no: true,
            score_10: true,
            letter_grade: true,
            score_4: true,
            is_pass: true,
            note: true,
            updated_at: true,
            courses: {
              select: { course_code: true, course_name: true, credits: true, course_type: true },
            },
          },
        })
      : [];

    return {
      student: {
        id: idToString(student.student_id),
        student_code: student.student_code,
        full_name: student.full_name,
        email: student.email ?? null,
        phone: student.phone ?? null,
        academic_status: student.academic_status,
        class: student.classes
          ? {
              id: idToString(student.class_id),
              class_code: student.classes.class_code,
              class_name: student.classes.class_name,
              major_name: student.classes.major_name,
              cohort_year: student.classes.cohort_year,
            }
          : null,
      },
      semester: {
        id: idToString(semester.semester_id),
        semester_code: semester.semester_code,
        name: semester.name,
      },
      snapshot: snapshot
        ? {
            gpa_semester: decimalToNumber(snapshot.gpa_semester),
            gpa_cumulative: decimalToNumber(snapshot.gpa_cumulative),
            credits_earned_semester: snapshot.credits_earned_semester,
            credits_failed_semester: snapshot.credits_failed_semester,
            failed_courses_count_semester: snapshot.failed_courses_count_semester,
            data_status: snapshot.data_status,
          }
        : {
            gpa_semester: null,
            gpa_cumulative: null,
            credits_earned_semester: 0,
            credits_failed_semester: 0,
            failed_courses_count_semester: 0,
            data_status: 'missing_data',
          },
      warnings: warnings.map((w) => ({
        id: idToString(w.warning_id),
        status: w.status,
        detected_value: decimalToNumber(w.detected_value),
        reason_text: w.reason_text,
        send: {
          channel: w.send_channel ?? null,
          status: w.send_status ?? null,
          error: w.send_error ?? null,
          sent_at: w.sent_at ?? null,
        },
        rule: w.warning_rules
          ? {
              rule_code: w.warning_rules.rule_code,
              rule_name: w.warning_rules.rule_name,
              condition_type: w.warning_rules.condition_type,
              operator: w.warning_rules.operator,
              threshold_value: Number(w.warning_rules.threshold_value),
            }
          : null,
      })),
      notes: notes.map((n) => ({
        id: idToString(n.note_id),
        content: n.content,
        counseling_date: n.counseling_date,
        handling_status: n.handling_status,
        warning_id: n.warning_id ? idToString(n.warning_id) : null,
        attachment_url: n.attachment_url ?? null,
        advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
        created_at: n.created_at,
      })),
      grades: includeGrades
        ? grades.map((g) => ({
            id: idToString(g.grade_id),
            attempt_no: g.attempt_no,
            score_10: decimalToNumber(g.score_10),
            letter_grade: g.letter_grade,
            score_4: decimalToNumber(g.score_4),
            is_pass: g.is_pass,
            note: g.note,
            updated_at: g.updated_at,
            course: g.courses
              ? {
                  course_code: g.courses.course_code,
                  course_name: g.courses.course_name,
                  credits: g.courses.credits,
                  course_type: g.courses.course_type,
                }
              : null,
          }))
        : null,
    };
  }

  // ================== NOTES ==================
  async createAdvisoryNote(advisorUserId: string, dto: CreateAdvisoryNoteDto) {
    await this.assertAdvisorCanAccessStudent(advisorUserId, dto.student_id);

    const student = await this.prisma.students.findUnique({
      where: { student_id: toBigInt(dto.student_id) },
      select: { class_id: true },
    });
    if (!student) throw new NotFoundException('Sinh viên không tồn tại');

    const note = await this.prisma.advisory_notes.create({
      data: {
        student_id: toBigInt(dto.student_id),
        class_id: student.class_id,
        advisor_user_id: toBigInt(advisorUserId),
        warning_id: dto.warning_id ? toBigInt(dto.warning_id) : null,
        content: dto.content,
        counseling_date: dto.counseling_date ? new Date(dto.counseling_date) : null,
        handling_status: (dto.handling_status as any) ?? 'not_contacted',
        attachment_url: dto.attachment_url ?? null,
      },
      select: {
        note_id: true,
        content: true,
        counseling_date: true,
        handling_status: true,
        attachment_url: true,
        warning_id: true,
        created_at: true,
      },
    });

    return {
      message: 'Tạo ghi chú tư vấn thành công',
      note: {
        id: idToString(note.note_id),
        content: note.content,
        counseling_date: note.counseling_date,
        handling_status: note.handling_status,
        attachment_url: note.attachment_url ?? null,
        warning_id: note.warning_id ? idToString(note.warning_id) : null,
        created_at: note.created_at,
      },
    };
  }

  async listNotesByStudent(advisorUserId: string, studentId: string) {
    await this.assertAdvisorCanAccessStudent(advisorUserId, studentId);

    const notes = await this.prisma.advisory_notes.findMany({
      where: { student_id: toBigInt(studentId) },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        note_id: true,
        content: true,
        counseling_date: true,
        handling_status: true,
        attachment_url: true,
        warning_id: true,
        created_at: true,
        users: { select: { user_id: true, full_name: true } },
      },
    });

    return notes.map((n) => ({
      id: idToString(n.note_id),
      content: n.content,
      counseling_date: n.counseling_date,
      handling_status: n.handling_status,
      attachment_url: n.attachment_url ?? null,
      warning_id: n.warning_id ? idToString(n.warning_id) : null,
      advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
      created_at: n.created_at,
    }));
  }

  // =================================================================
  // ======================= CODE MỚI BẮT ĐẦU =========================
  // (Không đụng vào code cũ phía trên)
  // =================================================================

  // ====== WARNING DETAIL ======
  async getWarningDetail(advisorUserId: string, warningId: string) {
    const w = await this.prisma.warnings.findUnique({
      where: { warning_id: toBigInt(warningId) },
      select: {
        warning_id: true,
        class_id: true,
        semester_id: true,
        student_id: true,
        rule_id: true,
        detected_value: true,
        reason_text: true,
        status: true,
        send_channel: true,
        send_status: true,
        send_error: true,
        sent_at: true,
        created_at: true,
        updated_at: true,
        acknowledged_at: true,
        acknowledged_by: true,
        resolved_at: true,
        resolved_by: true,
        students: {
          select: { student_code: true, full_name: true, email: true, phone: true },
        },
        classes: {
          select: { class_code: true, class_name: true, major_name: true, cohort_year: true },
        },
        semesters: {
          select: { semester_code: true, name: true, start_date: true, end_date: true, is_current: true },
        },
        warning_rules: {
          select: { rule_code: true, rule_name: true, condition_type: true, operator: true, threshold_value: true, level: true },
        },
        warning_send_logs: {
          orderBy: { attempted_at: 'desc' },
          take: 50,
          select: {
            send_log_id: true,
            channel: true,
            status: true,
            error: true,
            attempted_at: true,
            attempted_by: true,
          },
        },
        advisory_notes: {
          orderBy: { created_at: 'desc' },
          take: 30,
          select: {
            note_id: true,
            content: true,
            counseling_date: true,
            handling_status: true,
            attachment_url: true,
            created_at: true,
            advisor_user_id: true,
            users: { select: { user_id: true, full_name: true } },
          },
        },
      },
    });

    if (!w) throw new NotFoundException('Warning not found');
    await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));

    return {
      id: idToString(w.warning_id),
      status: w.status,
      detected_value: decimalToNumber(w.detected_value),
      reason_text: w.reason_text,
      send: {
        channel: w.send_channel ?? null,
        status: w.send_status ?? null,
        error: w.send_error ?? null,
        sent_at: w.sent_at ?? null,
      },
      student: {
        id: idToString(w.student_id),
        student_code: w.students?.student_code ?? null,
        full_name: w.students?.full_name ?? null,
        email: w.students?.email ?? null,
        phone: w.students?.phone ?? null,
      },
      class: w.classes
        ? {
            id: idToString(w.class_id),
            class_code: w.classes.class_code,
            class_name: w.classes.class_name,
            major_name: w.classes.major_name,
            cohort_year: w.classes.cohort_year,
          }
        : { id: idToString(w.class_id) },
      semester: w.semesters
        ? {
            id: idToString(w.semester_id),
            semester_code: w.semesters.semester_code,
            name: w.semesters.name,
            start_date: w.semesters.start_date,
            end_date: w.semesters.end_date,
            is_current: w.semesters.is_current,
          }
        : { id: idToString(w.semester_id) },
      rule: w.warning_rules
        ? {
            id: idToString(w.rule_id),
            rule_code: w.warning_rules.rule_code,
            rule_name: w.warning_rules.rule_name,
            condition_type: w.warning_rules.condition_type,
            operator: w.warning_rules.operator,
            threshold_value: Number(w.warning_rules.threshold_value),
            level: w.warning_rules.level ?? null,
          }
        : { id: idToString(w.rule_id) },
      lifecycle: {
        created_at: w.created_at,
        updated_at: w.updated_at,
        acknowledged_at: w.acknowledged_at ?? null,
        acknowledged_by: w.acknowledged_by ? idToString(w.acknowledged_by) : null,
        resolved_at: w.resolved_at ?? null,
        resolved_by: w.resolved_by ? idToString(w.resolved_by) : null,
      },
      send_logs: w.warning_send_logs.map((x) => ({
        id: idToString(x.send_log_id),
        channel: x.channel,
        status: x.status,
        error: x.error ?? null,
        attempted_at: x.attempted_at,
        attempted_by: x.attempted_by ? idToString(x.attempted_by) : null,
      })),
      notes: w.advisory_notes.map((n) => ({
        id: idToString(n.note_id),
        content: n.content,
        counseling_date: n.counseling_date,
        handling_status: n.handling_status,
        attachment_url: n.attachment_url ?? null,
        advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
        created_at: n.created_at,
      })),
    };
  }

  // ====== STUDENT TIMELINE ======
  async getStudentTimeline(advisorUserId: string, studentId: string, semesterId?: string) {
    await this.assertAdvisorCanAccessStudent(advisorUserId, studentId);

    const sid = toBigInt(studentId);
    const focusSemester = await this.resolveSemester(semesterId);

    const student = await this.prisma.students.findUnique({
      where: { student_id: sid },
      select: {
        student_id: true,
        student_code: true,
        full_name: true,
        academic_status: true,
        class_id: true,
        classes: { select: { class_code: true, class_name: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const [snapshots, warnings, notes, grades] = await Promise.all([
      this.prisma.gpa_snapshots.findMany({
        where: { student_id: sid },
        orderBy: { semester_id: 'desc' },
        take: 12,
        select: {
          semester_id: true,
          gpa_semester: true,
          gpa_cumulative: true,
          credits_earned_semester: true,
          credits_failed_semester: true,
          failed_courses_count_semester: true,
          data_status: true,
          semesters: { select: { semester_code: true, name: true, start_date: true, end_date: true } },
        },
      }),
      this.prisma.warnings.findMany({
        where: { student_id: sid },
        orderBy: { created_at: 'desc' },
        take: 50,
        select: {
          warning_id: true,
          semester_id: true,
          detected_value: true,
          reason_text: true,
          status: true,
          created_at: true,
          warning_rules: { select: { rule_code: true, rule_name: true, level: true } },
          semesters: { select: { semester_code: true, name: true } },
        },
      }),
      this.prisma.advisory_notes.findMany({
        where: { student_id: sid },
        orderBy: { created_at: 'desc' },
        take: 50,
        select: {
          note_id: true,
          content: true,
          counseling_date: true,
          handling_status: true,
          warning_id: true,
          attachment_url: true,
          created_at: true,
          users: { select: { user_id: true, full_name: true } },
        },
      }),
      this.prisma.grades.findMany({
        where: { student_id: sid, semester_id: focusSemester.semester_id },
        orderBy: [{ course_id: 'asc' }, { attempt_no: 'desc' }],
        select: {
          grade_id: true,
          attempt_no: true,
          score_10: true,
          letter_grade: true,
          score_4: true,
          is_pass: true,
          updated_at: true,
          courses: { select: { course_code: true, course_name: true, credits: true } },
        },
      }),
    ]);

    return {
      student: {
        id: idToString(student.student_id),
        student_code: student.student_code,
        full_name: student.full_name,
        academic_status: student.academic_status,
        class: student.classes
          ? { id: idToString(student.class_id), class_code: student.classes.class_code, class_name: student.classes.class_name }
          : { id: idToString(student.class_id) },
      },
      focus_semester: {
        id: idToString(focusSemester.semester_id),
        semester_code: focusSemester.semester_code,
        name: focusSemester.name,
        start_date: focusSemester.start_date,
        end_date: focusSemester.end_date,
        is_current: focusSemester.is_current,
      },
      snapshots: snapshots.map((s) => ({
        semester: s.semesters
          ? { id: idToString(s.semester_id), semester_code: s.semesters.semester_code, name: s.semesters.name, start_date: s.semesters.start_date, end_date: s.semesters.end_date }
          : { id: idToString(s.semester_id) },
        gpa_semester: decimalToNumber(s.gpa_semester),
        gpa_cumulative: decimalToNumber(s.gpa_cumulative),
        credits_earned_semester: s.credits_earned_semester,
        credits_failed_semester: s.credits_failed_semester,
        failed_courses_count_semester: s.failed_courses_count_semester,
        data_status: s.data_status,
      })),
      warnings: warnings.map((w) => ({
        id: idToString(w.warning_id),
        semester: w.semesters ? { id: idToString(w.semester_id), semester_code: w.semesters.semester_code, name: w.semesters.name } : { id: idToString(w.semester_id) },
        status: w.status,
        detected_value: decimalToNumber(w.detected_value),
        reason_text: w.reason_text,
        rule: w.warning_rules ? { rule_code: w.warning_rules.rule_code, rule_name: w.warning_rules.rule_name, level: w.warning_rules.level ?? null } : null,
        created_at: w.created_at,
      })),
      notes: notes.map((n) => ({
        id: idToString(n.note_id),
        content: n.content,
        counseling_date: n.counseling_date,
        handling_status: n.handling_status,
        warning_id: n.warning_id ? idToString(n.warning_id) : null,
        attachment_url: n.attachment_url ?? null,
        advisor: n.users ? { id: idToString(n.users.user_id), full_name: n.users.full_name } : null,
        created_at: n.created_at,
      })),
      grades_focus_semester: grades.map((g) => ({
        id: idToString(g.grade_id),
        attempt_no: g.attempt_no,
        score_10: decimalToNumber(g.score_10),
        letter_grade: g.letter_grade,
        score_4: decimalToNumber(g.score_4),
        is_pass: g.is_pass,
        updated_at: g.updated_at,
        course: g.courses ? { course_code: g.courses.course_code, course_name: g.courses.course_name, credits: g.courses.credits } : null,
      })),
    };
  }

  // ====== BULK UPDATE WARNING STATUS ======
  async bulkUpdateWarningStatus(advisorUserId: string, dto: BulkWarningStatusDto) {
    if (!dto.ids?.length) throw new BadRequestException('ids không được rỗng');

    const ids = dto.ids.map(toBigInt);

    const warnings = await this.prisma.warnings.findMany({
      where: { warning_id: { in: ids } },
      select: { warning_id: true, class_id: true },
    });

    if (warnings.length === 0) return { updated: 0, skipped: dto.ids.length };

    // lọc warning hợp lệ theo quyền lớp
    const allowed: bigint[] = [];
    for (const w of warnings) {
      try {
        await this.assertAdvisorCanAccessClass(advisorUserId, String(w.class_id));
        allowed.push(w.warning_id);
      } catch {
        // skip
      }
    }

    if (!allowed.length) return { updated: 0, skipped: dto.ids.length };

    const data: any = { status: dto.status as any, updated_at: new Date() };
    if (dto.status === 'Resolved') {
      data.resolved_at = new Date();
      data.resolved_by = toBigInt(advisorUserId);
    }

    const res = await this.prisma.warnings.updateMany({
      where: { warning_id: { in: allowed } },
      data,
    });

    return {
      updated: res.count,
      skipped: dto.ids.length - allowed.length,
    };
  }

  // ====== UPDATE NOTE ======
  async updateAdvisoryNote(advisorUserId: string, noteId: string, dto: UpdateAdvisoryNoteDto) {
    const note = await this.prisma.advisory_notes.findUnique({
      where: { note_id: toBigInt(noteId) },
      select: { note_id: true, class_id: true },
    });
    if (!note) throw new NotFoundException('Note không tồn tại');

    await this.assertAdvisorCanAccessClass(advisorUserId, String(note.class_id));

    const updated = await this.prisma.advisory_notes.update({
      where: { note_id: note.note_id },
      data: {
        content: dto.content ?? undefined,
        counseling_date: dto.counseling_date ? new Date(dto.counseling_date) : undefined,
        handling_status: dto.handling_status ? (dto.handling_status as any) : undefined,
        attachment_url: dto.attachment_url ?? undefined,
      },
      select: {
        note_id: true,
        content: true,
        counseling_date: true,
        handling_status: true,
        attachment_url: true,
        warning_id: true,
        created_at: true,
      },
    });

    return {
      message: 'Cập nhật ghi chú thành công',
      note: {
        id: idToString(updated.note_id),
        content: updated.content,
        counseling_date: updated.counseling_date,
        handling_status: updated.handling_status,
        attachment_url: updated.attachment_url ?? null,
        warning_id: updated.warning_id ? idToString(updated.warning_id) : null,
        created_at: updated.created_at,
      },
    };
  }

  // ====== DELETE NOTE ======
  async deleteAdvisoryNote(advisorUserId: string, noteId: string) {
    const note = await this.prisma.advisory_notes.findUnique({
      where: { note_id: toBigInt(noteId) },
      select: { note_id: true, class_id: true },
    });
    if (!note) throw new NotFoundException('Note không tồn tại');

    await this.assertAdvisorCanAccessClass(advisorUserId, String(note.class_id));

    await this.prisma.advisory_notes.delete({ where: { note_id: note.note_id } });
    return { message: 'Xoá ghi chú thành công', deleted: true };
  }

  // ====== CLASS ANALYTICS ======
  async getClassAnalytics(advisorUserId: string, classId: string, semesterId?: string) {
    await this.assertAdvisorCanAccessClass(advisorUserId, classId);

    const clsId = toBigInt(classId);
    const semester = await this.resolveSemester(semesterId);

    const [studentTotal, snaps, warnGroup] = await Promise.all([
      this.prisma.students.count({ where: { class_id: clsId } }),
      this.prisma.gpa_snapshots.findMany({
        where: { class_id: clsId, semester_id: semester.semester_id, data_status: 'ok' as any },
        select: { gpa_semester: true },
      }),
      this.prisma.warnings.groupBy({
        by: ['status'],
        where: { class_id: clsId, semester_id: semester.semester_id },
        _count: { status: true },
      }),
    ]);

    const gpas = snaps
      .map((x) => decimalToNumber(x.gpa_semester))
      .filter((x): x is number => typeof x === 'number');

    const avgGpa = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;

    const bins = [
      { key: '<2.0', from: -999, to: 2.0 },
      { key: '2.0-2.5', from: 2.0, to: 2.5 },
      { key: '2.5-3.2', from: 2.5, to: 3.2 },
      { key: '3.2-3.6', from: 3.2, to: 3.6 },
      { key: '>=3.6', from: 3.6, to: 999 },
    ];
    const dist: Record<string, number> = Object.fromEntries(bins.map((b) => [b.key, 0]));
    for (const g of gpas) {
      const b = bins.find((x) => g >= x.from && g < x.to);
      if (b) dist[b.key] += 1;
    }

    const warningsByStatus: Record<string, number> = {};
    for (const x of warnGroup) warningsByStatus[x.status] = x._count.status;

    return {
      class_id: classId,
      semester: {
        id: idToString(semester.semester_id),
        semester_code: semester.semester_code,
        name: semester.name,
      },
      students_total: studentTotal,
      avg_gpa_semester: avgGpa,
      gpa_distribution: dist,
      warnings_by_status: warningsByStatus,
    };
  }

  // ====== CLASS COURSE STATS ======
  async getClassCourseStats(advisorUserId: string, classId: string, semesterId?: string) {
    await this.assertAdvisorCanAccessClass(advisorUserId, classId);

    const clsId = toBigInt(classId);
    const semester = await this.resolveSemester(semesterId);

    const grades = await this.prisma.grades.findMany({
      where: { class_id: clsId, semester_id: semester.semester_id },
      select: { course_id: true, is_pass: true, score_10: true, courses: { select: { course_code: true, course_name: true } } },
    });

    const map = new Map<string, any>();
    for (const g of grades) {
      const key = idToString(g.course_id);
      if (!map.has(key)) {
        map.set(key, {
          course_id: key,
          course_code: g.courses?.course_code ?? null,
          course_name: g.courses?.course_name ?? null,
          total: 0,
          pass: 0,
          fail: 0,
          _sum: 0,
          _cnt: 0,
        });
      }
      const it = map.get(key);
      it.total += 1;
      if (g.is_pass === true) it.pass += 1;
      if (g.is_pass === false) it.fail += 1;
      const s10 = decimalToNumber(g.score_10);
      if (typeof s10 === 'number') {
        it._sum += s10;
        it._cnt += 1;
      }
    }

    const items = [...map.values()].map((it) => {
      const avg = it._cnt ? Number((it._sum / it._cnt).toFixed(2)) : null;
      const passRate = it.total ? Number((it.pass / it.total).toFixed(4)) : null;
      delete it._sum;
      delete it._cnt;
      return { ...it, avg_score_10: avg, pass_rate: passRate };
    });

    items.sort((a, b) => (b.fail ?? 0) - (a.fail ?? 0));

    return {
      class_id: classId,
      semester: { id: idToString(semester.semester_id), semester_code: semester.semester_code, name: semester.name },
      items,
    };
  }
}
