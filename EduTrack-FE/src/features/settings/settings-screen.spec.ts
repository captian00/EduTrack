import { describe, expect, it } from 'vitest';
import { toSettingsForm } from './settings-screen';

describe('toSettingsForm', () => {
  it('removes backend-only fields from the form state', () => {
    const result = toSettingsForm({
      id: 'settings-id',
      ownerId: 'owner-id',
      nextStudentNumber: 12,
      createdAt: '2026-10-06',
      updatedAt: '2026-10-06',
      displayName: null,
      bankCode: 'VCB',
      bankAccountNumber: '123456789',
      bankAccountName: 'NGUYEN VAN A',
      billExcusedAbsence: false,
      billUnexcusedAbsence: true,
      transferDescriptionTemplate: 'EDU {STUDENT_CODE} {YYYYMM}',
    } as Parameters<typeof toSettingsForm>[0]);

    expect(result).toEqual({
      displayName: '',
      bankCode: 'VCB',
      bankAccountNumber: '123456789',
      bankAccountName: 'NGUYEN VAN A',
      billExcusedAbsence: false,
      billUnexcusedAbsence: true,
      transferDescriptionTemplate: 'EDU {STUDENT_CODE} {YYYYMM}',
    });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('ownerId');
  });
});
