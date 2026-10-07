import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { QueryTuitionSummaryDto, TuitionPaymentState } from './dto/query-tuition-summary.dto.js';
@Injectable()
export class TuitionService {
  constructor(private readonly prisma: PrismaService) {}
  async studentDetail(
    ownerId: string,
    studentId: string,
    from?: string,
    to?: string,
  ) {
    if (from && to && new Date(from) > new Date(to))
      throw new BadRequestException('INVALID_DATE_RANGE');
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, ownerId },
    });
    if (!student) throw new NotFoundException('Student not found');
    const charges = await this.prisma.attendance.findMany({
      where: {
        ownerId,
        studentId,
        isBillable: true,
        ...(from || to
          ? {
              lesson: {
                lessonDate: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        lesson: { include: { class: true } },
        allocations: {
          where: { payment: { status: PaymentStatus.CONFIRMED } },
        },
      },
      orderBy: [{ lesson: { lessonDate: 'asc' } }, { createdAt: 'asc' }],
    });
    const items = charges.map((charge) => {
      const paid = charge.allocations.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const outstanding = charge.feeAmount - paid;
      return {
        ...charge,
        paid,
        outstanding,
        paymentState:
          outstanding === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
      };
    });
    return {
      student,
      items,
      totals: items.reduce(
        (result, item) => ({
          charged: result.charged + item.feeAmount,
          paid: result.paid + item.paid,
          outstanding: result.outstanding + item.outstanding,
        }),
        { charged: 0, paid: 0, outstanding: 0 },
      ),
    };
  }
  async summary(ownerId: string, query: QueryTuitionSummaryDto = new QueryTuitionSummaryDto()) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to))
      throw new BadRequestException('INVALID_DATE_RANGE');
    const search = query.search?.trim();
    const students = await this.prisma.student.findMany({
      where: {
        ownerId,
        ...(search ? { OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { studentCode: { contains: search, mode: 'insensitive' as const } },
        ] } : {}),
      },
      orderBy: { fullName: 'asc' },
    });
    const rows = await Promise.all(
      students.map(async (student) => {
        const detail = await this.studentDetail(ownerId, student.id, query.from, query.to);
        const totals = detail.totals;
        const paymentState = totals.outstanding === 0 ? TuitionPaymentState.PAID : totals.paid > 0 ? TuitionPaymentState.PARTIAL : TuitionPaymentState.UNPAID;
        return { student, ...totals, paymentState };
      }),
    );
    const filteredRows = query.paymentState ? rows.filter((row) => row.paymentState === query.paymentState) : rows;
    const total = filteredRows.length;
    const items = filteredRows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    return {
      items,
      totals: filteredRows.reduce(
        (result, item) => ({
          charged: result.charged + item.charged,
          paid: result.paid + item.paid,
          outstanding: result.outstanding + item.outstanding,
        }),
        { charged: 0, paid: 0, outstanding: 0 },
      ),
      meta: paginationMeta(query.page, query.pageSize, total),
    };
  }
  async outstandingCharges(
    tx: Prisma.TransactionClient,
    ownerId: string,
    studentId: string,
  ) {
    const charges = await tx.attendance.findMany({
      where: { ownerId, studentId, isBillable: true },
      include: {
        lesson: true,
        allocations: {
          where: { payment: { status: PaymentStatus.CONFIRMED } },
        },
      },
      orderBy: [{ lesson: { lessonDate: 'asc' } }, { createdAt: 'asc' }],
    });
    return charges
      .map((charge) => ({
        attendanceId: charge.id,
        lessonDate: charge.lesson.lessonDate,
        outstanding:
          charge.feeAmount -
          charge.allocations.reduce((sum, value) => sum + value.amount, 0),
      }))
      .filter((item) => item.outstanding > 0);
  }
}
