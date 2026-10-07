import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

const publicSettingsSelect = {
  displayName: true,
  bankCode: true,
  bankAccountNumber: true,
  bankAccountName: true,
  billExcusedAbsence: true,
  billUnexcusedAbsence: true,
  transferDescriptionTemplate: true,
} as const;

const transferDescriptionTokens = new Set([
  '{STUDENT_NAME}',
  '{MMYYYY}',
  '{LESSON_COUNT}',
  '{TOTAL_AMOUNT}',
  // Legacy tokens remain valid for settings saved before this release.
  '{STUDENT_CODE}',
  '{YYYYMM}',
]);

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}
  get(ownerId: string) {
    return this.prisma.ownerSettings.upsert({
      where: { ownerId },
      create: { ownerId },
      update: {},
      select: publicSettingsSelect,
    });
  }
  update(ownerId: string, input: UpdateSettingsDto) {
    if (input.transferDescriptionTemplate) {
      const tokens =
        input.transferDescriptionTemplate.match(/\{[^}]+\}/g) ?? [];
      if (
        tokens.some((token) => !transferDescriptionTokens.has(token))
      )
        throw new BadRequestException('Invalid transfer description token');
    }
    return this.prisma.ownerSettings.upsert({
      where: { ownerId },
      create: { ownerId, ...input },
      update: input,
      select: publicSettingsSelect,
    });
  }
}
