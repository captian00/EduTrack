import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import {
  BulkCreateEnrollmentDto,
  CreateClassDto,
  CreateEnrollmentDto,
  EndEnrollmentDto,
  QueryClassesDto,
  UpdateClassDto,
  UpdateEnrollmentDto,
} from './dto/class.dto.js';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(ownerId: string, query: QueryClassesDto) {
    const where: Prisma.ClassWhereInput = {
      ownerId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? { name: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where,
        include: {
          _count: { select: { enrollments: { where: { isActive: true } } } },
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.class.count({ where }),
    ]);
    return { items, meta: paginationMeta(query.page, query.pageSize, total) };
  }
  create(ownerId: string, input: CreateClassDto) {
    return this.prisma.class.create({ data: { ownerId, ...input } });
  }
  async get(ownerId: string, id: string) {
    const result = await this.prisma.class.findFirst({
      where: { id, ownerId },
      include: {
        enrollments: {
          include: { student: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!result) throw new NotFoundException('Class not found');
    return result;
  }
  async update(ownerId: string, id: string, input: UpdateClassDto) {
    await this.get(ownerId, id);
    return this.prisma.class.update({ where: { id }, data: input });
  }
  async enroll(ownerId: string, classId: string, input: CreateEnrollmentDto) {
    if (input.endDate && input.endDate < input.startDate)
      throw new BadRequestException('End date must be on or after start date');
    return this.prisma.$transaction(async (tx) => {
      const [classItem, student] = await Promise.all([
        tx.class.findFirst({ where: { id: classId, ownerId } }),
        tx.student.findFirst({ where: { id: input.studentId, ownerId } }),
      ]);
      if (!classItem || !student)
        throw new NotFoundException('Class or student not found');
      const overlap = await tx.enrollment.findFirst({
        where: {
          ownerId,
          classId,
          studentId: input.studentId,
          startDate: {
            lte: input.endDate
              ? new Date(input.endDate)
              : new Date('9999-12-31'),
          },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date(input.startDate) } },
          ],
        },
      });
      if (overlap)
        throw new ConflictException(
          'Enrollment overlaps an existing enrollment',
        );
      return tx.enrollment.create({
        data: {
          ownerId,
          classId,
          studentId: input.studentId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          feePerSession: input.feePerSession ?? classItem.defaultFee,
        },
      });
    });
  }
  async bulkEnroll(
    ownerId: string,
    classId: string,
    input: BulkCreateEnrollmentDto,
  ) {
    if (input.endDate && input.endDate < input.startDate)
      throw new BadRequestException('End date must be on or after start date');
    const studentIds = [...new Set(input.studentIds)];
    return this.prisma.$transaction(async (tx) => {
      const [classItem, students, overlap] = await Promise.all([
        tx.class.findFirst({ where: { id: classId, ownerId } }),
        tx.student.findMany({
          where: { id: { in: studentIds }, ownerId },
          select: { id: true },
        }),
        tx.enrollment.findFirst({
          where: {
            ownerId,
            classId,
            studentId: { in: studentIds },
            startDate: {
              lte: input.endDate
                ? new Date(input.endDate)
                : new Date('9999-12-31'),
            },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date(input.startDate) } },
            ],
          },
        }),
      ]);
      if (!classItem) throw new NotFoundException('Class not found');
      if (students.length !== studentIds.length)
        throw new NotFoundException('One or more students were not found');
      if (overlap)
        throw new ConflictException(
          'Enrollment overlaps an existing enrollment',
        );
      const result = await tx.enrollment.createMany({
        data: studentIds.map((studentId) => ({
          ownerId,
          classId,
          studentId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          feePerSession: input.feePerSession ?? classItem.defaultFee,
        })),
      });
      return { count: result.count };
    });
  }
  async endEnrollment(
    ownerId: string,
    classId: string,
    enrollmentId: string,
    input: EndEnrollmentDto,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, classId, ownerId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const endDate = new Date(input.endDate);
    if (endDate < enrollment.startDate)
      throw new BadRequestException('End date must be on or after start date');
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { endDate, isActive: false },
    });
  }
  async updateEnrollment(
    ownerId: string,
    classId: string,
    enrollmentId: string,
    input: UpdateEnrollmentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { id: enrollmentId, classId, ownerId },
      });
      if (!enrollment) throw new NotFoundException('Enrollment not found');

      const startDate = new Date(input.startDate);
      if (enrollment.endDate && startDate > enrollment.endDate)
        throw new BadRequestException(
          'Start date must be on or before end date',
        );

      const [overlap, earlierAttendance] = await Promise.all([
        tx.enrollment.findFirst({
          where: {
            id: { not: enrollmentId },
            ownerId,
            classId,
            studentId: enrollment.studentId,
            startDate: {
              lte: enrollment.endDate ?? new Date('9999-12-31'),
            },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
          select: { id: true },
        }),
        tx.attendance.findFirst({
          where: {
            ownerId,
            studentId: enrollment.studentId,
            lesson: { classId, lessonDate: { lt: startDate } },
          },
          select: { id: true },
        }),
      ]);
      if (overlap)
        throw new ConflictException(
          'Enrollment overlaps an existing enrollment',
        );
      if (earlierAttendance)
        throw new ConflictException('ENROLLMENT_HAS_EARLIER_ATTENDANCE');

      return tx.enrollment.update({
        where: { id: enrollmentId },
        data: { startDate },
      });
    });
  }
}
