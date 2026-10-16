import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
import { GenerateQrDto } from './dto/generate-qr.dto.js';

const VIETQR_DESCRIPTION_MAX_LENGTH = 40;

type PriceTier = {
  feePerSession: number;
  lessonCount: number;
  lessonDates: Date[];
  originalAmount: number;
  previouslyPaid: number;
  remainingAmount: number;
};

type ReceiptGroup = {
  billingMonth: string;
  classId: string;
  className: string;
  lessonDates: Date[];
  originalAmount: number;
  previouslyPaid: number;
  remainingAmount: number;
  priceTiers: Map<number, PriceTier>;
};

function normalizeTransferText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .replace(/[^A-Za-z0-9 /,.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactVietQrDescription(input: {
  studentName: string;
  monthLabel: string;
  lessonCount: number;
  amount: number;
}) {
  const prefix = normalizeTransferText(`HP ${input.monthLabel}`);
  if (prefix.length >= VIETQR_DESCRIPTION_MAX_LENGTH)
    return prefix.slice(0, VIETQR_DESCRIPTION_MAX_LENGTH).trim();
  const nameLength = VIETQR_DESCRIPTION_MAX_LENGTH - prefix.length - 1;
  const studentName = normalizeTransferText(input.studentName)
    .slice(0, nameLength)
    .trim();
  return `${prefix} ${studentName}`.trim();
}
@Injectable()
export class QrPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tuition: TuitionService,
  ) {}
  async generate(ownerId: string, input: GenerateQrDto) {
    const scope = {
      billingMonths: input.billingMonths,
      classIds: input.classIds,
    };
    const [student, settings, charges] = await Promise.all([
      this.prisma.student.findFirst({
        where: { id: input.studentId, ownerId },
      }),
      this.prisma.ownerSettings.findUnique({ where: { ownerId } }),
      this.prisma.$transaction((tx) =>
        this.tuition.outstandingCharges(tx, ownerId, input.studentId, scope),
      ),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!settings?.bankCode || !settings.bankAccountNumber)
      throw new BadRequestException('Bank settings are incomplete');
    const outstanding = charges.reduce(
      (sum, charge) => sum + charge.outstanding,
      0,
    );
    if (outstanding === 0) throw new BadRequestException('PAYMENT_SCOPE_EMPTY');
    if (input.amount !== outstanding)
      throw new BadRequestException('PAYMENT_AMOUNT_MISMATCH');
    const selectedMonths = [...input.billingMonths].sort();
    const monthLabels = selectedMonths.map(
      (month) => `${Number(month.slice(5, 7))}/${month.slice(0, 4)}`,
    );
    const transferMonthLabel = `T${monthLabels.join(',')}`;
    const templateMonths = monthLabels.join(', ');
    const yearMonth = selectedMonths.join(',');
    const lessonCount = charges.length;
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(input.amount);
    const fullDescription = settings.transferDescriptionTemplate
      .replaceAll('{STUDENT_NAME}', student.fullName)
      .replaceAll('{MMYYYY}', templateMonths)
      .replaceAll('{LESSON_COUNT}', String(lessonCount))
      .replaceAll('{TOTAL_AMOUNT}', formattedAmount)
      .replaceAll('{STUDENT_CODE}', student.studentCode)
      .replaceAll('{YYYYMM}', yearMonth)
      .trim();
    const description = compactVietQrDescription({
      studentName: student.fullName,
      monthLabel: transferMonthLabel,
      lessonCount,
      amount: input.amount,
    });
    const imageUrl = `https://img.vietqr.io/image/${encodeURIComponent(settings.bankCode)}-${encodeURIComponent(settings.bankAccountNumber)}-compact2.png?amount=${input.amount}&addInfo=${encodeURIComponent(description)}${settings.bankAccountName ? `&accountName=${encodeURIComponent(settings.bankAccountName)}` : ''}`;
    const groupMap = new Map<string, ReceiptGroup>();
    for (const charge of charges) {
      const billingMonth = charge.lessonDate.toISOString().slice(0, 7);
      const key = `${billingMonth}:${charge.classId}`;
      const group: ReceiptGroup = groupMap.get(key) ?? {
        billingMonth,
        classId: charge.classId,
        className: charge.className,
        lessonDates: [],
        originalAmount: 0,
        previouslyPaid: 0,
        remainingAmount: 0,
        priceTiers: new Map<number, PriceTier>(),
      };
      group.lessonDates.push(charge.lessonDate);
      group.originalAmount += charge.feeAmount;
      group.previouslyPaid += charge.paid;
      group.remainingAmount += charge.outstanding;
      const tier = group.priceTiers.get(charge.feeAmount) ?? {
        feePerSession: charge.feeAmount,
        lessonCount: 0,
        lessonDates: [],
        originalAmount: 0,
        previouslyPaid: 0,
        remainingAmount: 0,
      };
      tier.lessonCount += 1;
      tier.lessonDates.push(charge.lessonDate);
      tier.originalAmount += charge.feeAmount;
      tier.previouslyPaid += charge.paid;
      tier.remainingAmount += charge.outstanding;
      group.priceTiers.set(charge.feeAmount, tier);
      groupMap.set(key, group);
    }
    const groups = [...groupMap.values()].map((group) => ({
      ...group,
      lessonCount: group.lessonDates.length,
      priceTiers: [...group.priceTiers.values()],
    }));
    const summary = groups.reduce(
      (result, group) => ({
        originalAmount: result.originalAmount + group.originalAmount,
        previouslyPaid: result.previouslyPaid + group.previouslyPaid,
        remainingAmount: result.remainingAmount + group.remainingAmount,
      }),
      { originalAmount: 0, previouslyPaid: 0, remainingAmount: 0 },
    );
    return {
      imageUrl,
      amount: input.amount,
      description,
      fullDescription,
      selectedMonths,
      monthLabel: `Tháng ${monthLabels.join(', ')}`,
      teacherName: settings.displayName,
      classCount: new Set(charges.map((charge) => charge.classId)).size,
      student: {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
      },
      lessonCount,
      summary,
      groups,
      bankCode: settings.bankCode,
      bankAccountNumber: settings.bankAccountNumber,
      bankAccountName: settings.bankAccountName,
    };
  }
}
