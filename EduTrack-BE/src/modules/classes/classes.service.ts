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
  CreateClassDto,
  CreateEnrollmentDto,
  EndEnrollmentDto,
  QueryClassesDto,
  UpdateClassDto,
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
}
