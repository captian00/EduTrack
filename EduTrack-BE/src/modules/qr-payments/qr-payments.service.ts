import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
import { GenerateQrDto } from './dto/generate-qr.dto.js';

const VIETQR_DESCRIPTION_MAX_LENGTH = 40;

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
  monthYear: string;
  lessonCount: number;
  amount: number;
}) {
  const suffix = ` HP ${input.monthYear} ${input.lessonCount}B ${input.amount}`;
  const nameLength = Math.max(
    1,
    VIETQR_DESCRIPTION_MAX_LENGTH - suffix.length,
  );
  const studentName = normalizeTransferText(input.studentName)
    .slice(0, nameLength)
    .trim();
  return `${studentName}${suffix}`.slice(0, VIETQR_DESCRIPTION_MAX_LENGTH);
}
@Injectable()
export class QrPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tuition: TuitionService,
  ) {}
  async generate(ownerId: string, input: GenerateQrDto) {
    const [student, settings, detail] = await Promise.all([
      this.prisma.student.findFirst({
        where: { id: input.studentId, ownerId },
      }),
      this.prisma.ownerSettings.findUnique({ where: { ownerId } }),
      this.tuition.studentDetail(ownerId, input.studentId),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!settings?.bankCode || !settings.bankAccountNumber)
      throw new BadRequestException('Bank settings are incomplete');
    if (input.amount > detail.totals.outstanding)
      throw new BadRequestException('Amount exceeds outstanding tuition');
    const monthYear = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());
    const yearMonth = monthYear.split('/').reverse().join('');
    const lessonCount = detail.items.filter(
      (item) => item.outstanding > 0,
    ).length;
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(input.amount);
    const fullDescription = settings.transferDescriptionTemplate
      .replaceAll('{STUDENT_NAME}', student.fullName)
      .replaceAll('{MMYYYY}', monthYear)
      .replaceAll('{LESSON_COUNT}', String(lessonCount))
      .replaceAll('{TOTAL_AMOUNT}', formattedAmount)
      .replaceAll('{STUDENT_CODE}', student.studentCode)
      .replaceAll('{YYYYMM}', yearMonth)
      .trim();
    const description = compactVietQrDescription({
      studentName: student.fullName,
      monthYear,
      lessonCount,
      amount: input.amount,
    });
    const imageUrl = `https://img.vietqr.io/image/${encodeURIComponent(settings.bankCode)}-${encodeURIComponent(settings.bankAccountNumber)}-compact2.png?amount=${input.amount}&addInfo=${encodeURIComponent(description)}${settings.bankAccountName ? `&accountName=${encodeURIComponent(settings.bankAccountName)}` : ''}`;
    return {
      imageUrl,
      amount: input.amount,
      description,
      fullDescription,
      bankCode: settings.bankCode,
      bankAccountNumber: settings.bankAccountNumber,
      bankAccountName: settings.bankAccountName,
    };
  }
}
