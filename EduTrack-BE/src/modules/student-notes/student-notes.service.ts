import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { CreateStudentNoteDto, QueryStudentNotesDto, UpdateStudentNoteDto } from './dto/student-note.dto.js';

const localDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

export function noteRetentionStart(date = new Date()) {
  const [year, month, day] = localDate(date).split('-').map(Number);
  const targetMonth = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}

@Injectable()
export class StudentNotesService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 2 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  cleanupExpired() {
    return this.prisma.studentNote.deleteMany({ where: { noteDate: { lt: new Date(noteRetentionStart()) } } });
  }

  async list(ownerId: string, studentId: string, query: QueryStudentNotesDto) {
    await this.assertStudent(ownerId, studentId);
    await this.cleanupExpired();
    const retention = noteRetentionStart();
    const from = query.from && query.from > retention ? query.from : retention;
    if (query.to && from > query.to) throw new BadRequestException('INVALID_DATE_RANGE');
    const noteDate = { gte: new Date(from), ...(query.to ? { lte: new Date(query.to) } : {}) };
    const [studentNotes, attendances] = await Promise.all([
      this.prisma.studentNote.findMany({ where: { ownerId, studentId, noteDate }, include: { lesson: { include: { class: true } } } }),
      this.prisma.attendance.findMany({ where: { ownerId, studentId, note: { not: null }, lesson: { lessonDate: noteDate } }, include: { lesson: { include: { class: true } } } }),
    ]);
    const items = [
      ...studentNotes.map((note) => ({ id: note.id, source: 'STUDENT_NOTE' as const, content: note.content, noteDate: note.noteDate, createdAt: note.createdAt, lesson: note.lesson ? { id: note.lesson.id, lessonDate: note.lesson.lessonDate, className: note.lesson.class.name } : undefined, editable: true, deletable: true })),
      ...attendances.filter((attendance) => attendance.note?.trim()).map((attendance) => ({ id: attendance.id, source: 'ATTENDANCE' as const, content: attendance.note!.trim(), noteDate: attendance.lesson.lessonDate, createdAt: attendance.createdAt, lesson: { id: attendance.lesson.id, lessonDate: attendance.lesson.lessonDate, className: attendance.lesson.class.name }, editable: false, deletable: false })),
    ].sort((left, right) => right.noteDate.getTime() - left.noteDate.getTime() || right.createdAt.getTime() - left.createdAt.getTime());
    const total = items.length;
    const pagedItems = items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    return { items: pagedItems, meta: paginationMeta(query.page, query.pageSize, total) };
  }

  async create(ownerId: string, studentId: string, input: CreateStudentNoteDto) {
    await this.cleanupExpired();
    await this.assertStudent(ownerId, studentId);
    this.assertDate(input.noteDate);
    if (!input.content.trim()) throw new BadRequestException('STUDENT_NOTE_CONTENT_REQUIRED');
    if (input.lessonId) await this.assertLessonStudent(ownerId, input.lessonId, studentId);
    return this.prisma.studentNote.create({ data: { ownerId, studentId, lessonId: input.lessonId, noteDate: new Date(input.noteDate), content: input.content.trim() } });
  }

  async update(ownerId: string, id: string, input: UpdateStudentNoteDto) {
    await this.cleanupExpired();
    await this.get(ownerId, id);
    if (input.noteDate) this.assertDate(input.noteDate);
    if (input.content !== undefined && !input.content.trim()) throw new BadRequestException('STUDENT_NOTE_CONTENT_REQUIRED');
    return this.prisma.studentNote.update({ where: { id }, data: { ...(input.content !== undefined ? { content: input.content.trim() } : {}), ...(input.noteDate ? { noteDate: new Date(input.noteDate) } : {}) } });
  }

  async remove(ownerId: string, id: string) { await this.cleanupExpired(); await this.get(ownerId, id); await this.prisma.studentNote.delete({ where: { id } }); return { success: true }; }
  async get(ownerId: string, id: string) { const note = await this.prisma.studentNote.findFirst({ where: { id, ownerId } }); if (!note) throw new NotFoundException('STUDENT_NOTE_NOT_FOUND'); return note; }
  private async assertStudent(ownerId: string, id: string) { if (!(await this.prisma.student.findFirst({ where: { id, ownerId } }))) throw new NotFoundException('STUDENT_NOT_FOUND'); }
  private assertDate(value: string) { if (value < noteRetentionStart() || value > localDate()) throw new BadRequestException('STUDENT_NOTE_DATE_OUT_OF_RANGE'); }
  private async assertLessonStudent(ownerId: string, lessonId: string, studentId: string) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, ownerId }, select: { lessonDate: true, classId: true } });
    if (!lesson) throw new NotFoundException('LESSON_NOT_FOUND');
    const enrolled = await this.prisma.enrollment.findFirst({ where: { ownerId, studentId, classId: lesson.classId, startDate: { lte: lesson.lessonDate }, OR: [{ endDate: null }, { endDate: { gte: lesson.lessonDate } }] } });
    if (!enrolled) throw new BadRequestException('STUDENT_NOT_IN_LESSON');
  }
}
