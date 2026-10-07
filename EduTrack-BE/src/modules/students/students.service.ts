import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import {
  CreateStudentDto,
  QueryStudentsDto,
  UpdateStudentDto,
} from './dto/student.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string, query: QueryStudentsDto) {
    const search = query.search?.trim();
    const where: Prisma.StudentWhereInput = {
      ownerId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(search
        ? {
            OR: ['fullName', 'parentName', 'parentPhone', 'studentCode'].map(
              (field) => ({
                [field]: { contains: search, mode: 'insensitive' },
              }),
            ),
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.student.count({ where }),
    ]);
    return { items, meta: paginationMeta(query.page, query.pageSize, total) };
  }

  async create(ownerId: string, input: CreateStudentDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const settings = await tx.ownerSettings.upsert({
          where: { ownerId },
          create: { ownerId, nextStudentNumber: 2 },
          update: { nextStudentNumber: { increment: 1 } },
          select: { nextStudentNumber: true },
        });
        const number = settings.nextStudentNumber - 1;
        return tx.student.create({
          data: {
            ownerId,
            studentCode: `HS${number.toString().padStart(4, '0')}`,
            ...input,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async get(ownerId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, ownerId },
      include: {
        enrollments: {
          include: { class: true },
          orderBy: { startDate: 'desc' },
        },
        attendances: {
          include: { lesson: { include: { class: true } } },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: { allocations: true },
          orderBy: { paidAt: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(ownerId: string, id: string, input: UpdateStudentDto) {
    await this.get(ownerId, id);
    return this.prisma.student.update({ where: { id }, data: input });
  }
}
