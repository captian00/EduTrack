import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessonStatus, Prisma } from '@prisma/client';
import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import {
  CreateLessonDto,
  QueryLessonsDto,
  UpdateLessonDto,
} from './dto/lesson.dto.js';
const timeValue = (value?: string) =>
  value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(ownerId: string, query: QueryLessonsDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to))
      throw new BadRequestException('INVALID_DATE_RANGE');
    const where: Prisma.LessonWhereInput = {
      ownerId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            lessonDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        include: { class: true, _count: { select: { attendances: true } } },
        orderBy: [{ lessonDate: 'desc' }, { startTime: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.lesson.count({ where }),
    ]);
    return { items, meta: paginationMeta(query.page, query.pageSize, total) };
  }
  async create(ownerId: string, input: CreateLessonDto) {
    await this.assertClass(ownerId, input.classId);
    this.assertTimes(input.startTime, input.endTime);
    const lessonDate = new Date(input.lessonDate);
    const startTime = timeValue(input.startTime);
    await this.assertNotDuplicate(ownerId, input.classId, lessonDate, startTime);
    return this.prisma.lesson.create({
      data: {
        ownerId,
        classId: input.classId,
        lessonDate,
        startTime,
        endTime: timeValue(input.endTime),
        topic: input.topic,
      },
    });
  }
  async get(ownerId: string, id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, ownerId },
      include: { class: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
  async students(ownerId: string, id: string) {
    const lesson = await this.get(ownerId, id);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { ownerId, classId: lesson.classId, startDate: { lte: lesson.lessonDate }, OR: [{ endDate: null }, { endDate: { gte: lesson.lessonDate } }] },
      include: { student: { include: { studentNotes: { where: { lessonId: id }, orderBy: { createdAt: 'desc' } } } } },
      orderBy: { student: { fullName: 'asc' } },
    });
    return { lesson, items: enrollments.map(({ student }) => ({ student: { id: student.id, studentCode: student.studentCode, fullName: student.fullName }, notes: student.studentNotes })) };
  }
  async update(ownerId: string, id: string, input: UpdateLessonDto) {
    const lesson = await this.get(ownerId, id);
    if (lesson.status !== LessonStatus.SCHEDULED)
      throw new BadRequestException('Only scheduled lessons can be edited');
    if (input.classId) await this.assertClass(ownerId, input.classId);
    this.assertTimes(input.startTime, input.endTime);
    if (input.classId || input.lessonDate || input.startTime !== undefined) {
      await this.assertNotDuplicate(
        ownerId,
        input.classId ?? lesson.classId,
        input.lessonDate ? new Date(input.lessonDate) : lesson.lessonDate,
        input.startTime !== undefined ? timeValue(input.startTime) : lesson.startTime,
        id,
      );
    }
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(input.classId ? { classId: input.classId } : {}),
        ...(input.lessonDate ? { lessonDate: new Date(input.lessonDate) } : {}),
        ...(input.startTime !== undefined
          ? { startTime: timeValue(input.startTime) }
          : {}),
        ...(input.endTime !== undefined
          ? { endTime: timeValue(input.endTime) }
          : {}),
        ...(input.topic !== undefined ? { topic: input.topic } : {}),
      },
    });
  }
  async cancel(ownerId: string, id: string) {
    const lesson = await this.get(ownerId, id);
    if (lesson.status === LessonStatus.COMPLETED)
      throw new BadRequestException('Completed lessons cannot be cancelled');
    return this.prisma.lesson.update({
      where: { id },
      data: { status: LessonStatus.CANCELLED },
    });
  }
  private async assertClass(ownerId: string, id: string) {
    if (
      !(await this.prisma.class.findFirst({
        where: { id, ownerId, isActive: true },
      }))
    )
      throw new NotFoundException('CLASS_NOT_FOUND');
  }
  private assertTimes(start?: string, end?: string) {
    if (start && end && end <= start)
      throw new BadRequestException('INVALID_LESSON_TIME');
  }
  private async assertNotDuplicate(ownerId: string, classId: string, lessonDate: Date, startTime: Date | null, excludeId?: string) {
    const duplicate = await this.prisma.lesson.findFirst({ where: { ownerId, classId, lessonDate, startTime, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (duplicate) throw new ConflictException('LESSON_ALREADY_EXISTS');
  }
}
