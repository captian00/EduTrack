import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { paginationMeta } from '../../common/dto/pagination-query.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
import {
  CreatePaymentDto,
  QueryPaymentsDto,
  VoidPaymentDto,
} from './dto/payment.dto.js';
import { allocateOldestFirst } from '../../common/domain/finance-rules.js';
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tuition: TuitionService,
  ) {}
  async list(ownerId: string, query: QueryPaymentsDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to))
      throw new BadRequestException('INVALID_DATE_RANGE');
    const where: Prisma.PaymentWhereInput = {
      ownerId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.from || query.to
        ? { paidAt: { ...(query.from ? { gte: new Date(`${query.from}T00:00:00+07:00`) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999+07:00`) } : {}) } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { student: true, allocations: true },
        orderBy: { paidAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, meta: paginationMeta(query.page, query.pageSize, total) };
  }
  async get(ownerId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, ownerId },
      include: {
        student: true,
        allocations: {
          include: {
            attendance: { include: { lesson: { include: { class: true } } } },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
  async preview(ownerId: string, input: CreatePaymentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: input.studentId, ownerId },
    });
    if (!student) throw new NotFoundException('Student not found');
    const scope = this.paymentScope(input);
    const charges = await this.prisma.$transaction((tx) =>
      this.tuition.outstandingCharges(tx, ownerId, input.studentId, scope),
    );
    this.validateScopedAmount(charges, input.amount, scope);
    return {
      student,
      amount: input.amount,
      allocations: this.allocate(charges, input.amount),
    };
  }
  async create(ownerId: string, input: CreatePaymentDto) {
    return this.prisma.$transaction(
      async (tx) => {
        if (
          !(await tx.student.findFirst({
            where: { id: input.studentId, ownerId },
          }))
        )
          throw new NotFoundException('Student not found');
        const scope = this.paymentScope(input);
        const charges = await this.tuition.outstandingCharges(
          tx,
          ownerId,
          input.studentId,
          scope,
        );
        const total = charges.reduce(
          (sum, value) => sum + value.outstanding,
          0,
        );
        if (scope && input.amount !== total)
          throw new ConflictException('PAYMENT_AMOUNT_MISMATCH');
        if (input.amount > total)
          throw new ConflictException('PAYMENT_OVER_ALLOCATION');
        const allocations = this.allocate(charges, input.amount);
        const payment = await tx.payment.create({
          data: {
            ownerId,
            studentId: input.studentId,
            amount: input.amount,
            paidAt: new Date(input.paidAt),
            method: input.method,
            reference: input.reference,
            note: input.note,
          },
        });
        await tx.paymentAllocation.createMany({
          data: allocations.map((value) => ({
            ownerId,
            paymentId: payment.id,
            attendanceId: value.attendanceId,
            amount: value.amount,
          })),
        });
        return tx.payment.findUnique({
          where: { id: payment.id },
          include: { allocations: true, student: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async void(ownerId: string, id: string, input: VoidPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, ownerId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.VOIDED)
      throw new BadRequestException('Payment is already voided');
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.VOIDED,
        voidedAt: new Date(),
        voidReason: input.reason,
      },
    });
  }
  private allocate(
    charges: { attendanceId: string; outstanding: number }[],
    amount: number,
  ) {
    const total = charges.reduce((sum, item) => sum + item.outstanding, 0);
    if (amount > total) throw new ConflictException('PAYMENT_OVER_ALLOCATION');
    return allocateOldestFirst(charges, amount);
  }
  private paymentScope(input: CreatePaymentDto) {
    if (Boolean(input.billingMonth) !== Boolean(input.classId))
      throw new BadRequestException('PAYMENT_SCOPE_INCOMPLETE');
    return input.billingMonth && input.classId
      ? { billingMonth: input.billingMonth, classId: input.classId }
      : undefined;
  }
  private validateScopedAmount(
    charges: { outstanding: number }[],
    amount: number,
    scope?: { billingMonth: string; classId: string },
  ) {
    if (!scope) return;
    const total = charges.reduce((sum, item) => sum + item.outstanding, 0);
    if (total === 0) throw new BadRequestException('PAYMENT_SCOPE_EMPTY');
    if (amount !== total)
      throw new ConflictException('PAYMENT_AMOUNT_MISMATCH');
  }
}
