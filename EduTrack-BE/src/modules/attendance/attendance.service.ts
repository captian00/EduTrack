import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, LessonStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { isBillableAttendance } from '../../common/domain/finance-rules.js';
import { SaveAttendanceDto } from './dto/save-attendance.dto.js';
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}
  async roster(ownerId: string, lessonId: string) {
    const lesson = await this.lesson(ownerId, lessonId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        ownerId,
        classId: lesson.classId,
        startDate: { lte: lesson.lessonDate },
        OR: [{ endDate: null }, { endDate: { gte: lesson.lessonDate } }],
      },
      include: { student: true },
      orderBy: { student: { fullName: 'asc' } },
    });
    const existing = await this.prisma.attendance.findMany({
      where: { ownerId, lessonId },
    });
    const makeupCandidates = await this.prisma.attendance.findMany({
      where: {
        ownerId,
        studentId: { in: enrollments.map((item) => item.studentId) },
        status: {
          in: [
            AttendanceStatus.ABSENT_EXCUSED,
            AttendanceStatus.ABSENT_UNEXCUSED,
          ],
        },
        makeup: null,
        id: { notIn: existing.map((item) => item.id) },
      },
      include: { lesson: true },
      orderBy: { lesson: { lessonDate: 'desc' } },
    });
    return {
      lesson,
      items: enrollments.map((enrollment) => ({
        student: enrollment.student,
        feePerSession: enrollment.feePerSession,
        attendance:
          existing.find((item) => item.studentId === enrollment.studentId) ??
          null,
        makeupCandidates: makeupCandidates.filter(
          (item) => item.studentId === enrollment.studentId,
        ),
      })),
    };
  }
  async save(ownerId: string, lessonId: string, input: SaveAttendanceDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const lesson = await tx.lesson.findFirst({
          where: { id: lessonId, ownerId },
        });
        if (!lesson) throw new NotFoundException('Lesson not found');
        if (lesson.status === LessonStatus.CANCELLED)
          throw new ConflictException('LESSON_CANCELLED');
        const existingPaid = await tx.paymentAllocation.count({
          where: {
            ownerId,
            attendance: { lessonId },
            payment: { status: 'CONFIRMED' },
          },
        });
        if (existingPaid > 0)
          throw new ConflictException('ATTENDANCE_HAS_PAYMENT');
        const ids = input.items.map((item) => item.studentId);
        if (new Set(ids).size !== ids.length)
          throw new BadRequestException('Duplicate student attendance');
        const enrollments = await tx.enrollment.findMany({
          where: {
            ownerId,
            classId: lesson.classId,
            studentId: { in: ids },
            startDate: { lte: lesson.lessonDate },
            OR: [{ endDate: null }, { endDate: { gte: lesson.lessonDate } }],
          },
        });
        const settings = await tx.ownerSettings.findUnique({
          where: { ownerId },
        });
        if (enrollments.length !== ids.length)
          throw new BadRequestException(
            'Student is not enrolled for lesson date',
          );
        for (const item of input.items) {
          const isMakeup = item.status === AttendanceStatus.MAKEUP;
          if (isMakeup !== Boolean(item.makeupForAttendanceId))
            throw new BadRequestException('INVALID_MAKEUP');
          if (isMakeup) {
            const source = await tx.attendance.findFirst({
              where: {
                id: item.makeupForAttendanceId,
                ownerId,
                studentId: item.studentId,
                status: {
                  in: [
                    AttendanceStatus.ABSENT_EXCUSED,
                    AttendanceStatus.ABSENT_UNEXCUSED,
                  ],
                },
                makeup: null,
              },
            });
            if (!source) throw new BadRequestException('INVALID_MAKEUP');
          }
          const enrollment = enrollments.find(
            (value) => value.studentId === item.studentId,
          )!;
          const isBillable = isBillableAttendance(item.status, {
            billExcusedAbsence: settings?.billExcusedAbsence ?? false,
            billUnexcusedAbsence: settings?.billUnexcusedAbsence ?? true,
          });
          await tx.attendance.upsert({
            where: {
              lessonId_studentId: { lessonId, studentId: item.studentId },
            },
            create: {
              ownerId,
              lessonId,
              studentId: item.studentId,
              status: item.status,
              note: item.note,
              makeupForAttendanceId: item.makeupForAttendanceId,
              isBillable,
              feeAmount: enrollment.feePerSession,
            },
            update: {
              status: item.status,
              note: item.note,
              makeupForAttendanceId: item.makeupForAttendanceId ?? null,
              isBillable,
            },
          });
        }
        await tx.lesson.update({
          where: { id: lessonId },
          data: { status: LessonStatus.COMPLETED },
        });
        return tx.attendance.findMany({
          where: { lessonId, ownerId },
          include: { student: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  private async lesson(ownerId: string, id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, ownerId },
      include: { class: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}
