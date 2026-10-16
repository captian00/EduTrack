import { ConflictException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentsService } from './payments.service.js';

describe('PaymentsService scoped payments', () => {
  const student = { id: 'student-id' };
  const input = {
    studentId: 'student-id',
    amount: 500_000,
    paidAt: '2026-09-30T00:00:00.000Z',
    method: PaymentMethod.BANK_TRANSFER,
    billingMonths: ['2026-09', '2026-10'],
    classIds: ['class-id', 'class-id-2'],
  };

  function setup(charges: { attendanceId: string; outstanding: number }[]) {
    const transactionClient = {};
    const outstandingCalls: unknown[][] = [];
    const prisma = {
      student: { findFirst: () => Promise.resolve(student) },
      $transaction: (callback: (tx: unknown) => unknown) =>
        Promise.resolve(callback(transactionClient)),
    };
    const tuition = {
      outstandingCharges: (...args: unknown[]) => {
        outstandingCalls.push(args);
        return Promise.resolve(charges);
      },
    };
    return {
      service: new PaymentsService(prisma as never, tuition as never),
      outstandingCalls,
      transactionClient,
    };
  }

  it('limits preview allocations to the selected billing scope', async () => {
    const charges = [
      { attendanceId: 'attendance-1', outstanding: 250_000 },
      { attendanceId: 'attendance-2', outstanding: 250_000 },
    ];
    const { service, outstandingCalls, transactionClient } = setup(charges);

    const result = await service.preview('owner-id', input);

    expect(outstandingCalls).toEqual([
      [
        transactionClient,
        'owner-id',
        'student-id',
        {
          billingMonths: ['2026-09', '2026-10'],
          classIds: ['class-id', 'class-id-2'],
        },
      ],
    ]);
    expect(result.allocations).toEqual([
      { attendanceId: 'attendance-1', amount: 250_000 },
      { attendanceId: 'attendance-2', amount: 250_000 },
    ]);
  });

  it('rejects an amount that differs from the selected period debt', async () => {
    const { service } = setup([
      { attendanceId: 'attendance-1', outstanding: 250_000 },
    ]);

    await expect(service.preview('owner-id', input)).rejects.toThrow(
      ConflictException,
    );
  });
});
