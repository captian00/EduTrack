import { ConflictException } from '@nestjs/common';
import { ClassesService } from './classes.service.js';

describe('ClassesService bulk enrollment', () => {
  const input = {
    studentIds: ['student-1', 'student-2', 'student-1'],
    startDate: '2026-09-01',
  };

  function setup(overlap: object | null) {
    let createdData: unknown;
    const tx = {
      class: {
        findFirst: () => Promise.resolve({ id: 'class-id', defaultFee: 250_000 }),
      },
      student: {
        findMany: () =>
          Promise.resolve([{ id: 'student-1' }, { id: 'student-2' }]),
      },
      enrollment: {
        findFirst: () => Promise.resolve(overlap),
        createMany: ({ data }: { data: unknown }) => {
          createdData = data;
          return Promise.resolve({ count: 2 });
        },
      },
    };
    const prisma = {
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    };
    return {
      service: new ClassesService(prisma as never),
      getCreatedData: () => createdData,
    };
  }

  it('deduplicates students and creates the batch atomically', async () => {
    const { service, getCreatedData } = setup(null);

    await expect(
      service.bulkEnroll('owner-id', 'class-id', input),
    ).resolves.toEqual({ count: 2 });
    expect(getCreatedData()).toEqual([
      expect.objectContaining({ studentId: 'student-1', feePerSession: 250_000 }),
      expect.objectContaining({ studentId: 'student-2', feePerSession: 250_000 }),
    ]);
  });

  it('rejects the entire batch when an enrollment overlaps', async () => {
    const { service, getCreatedData } = setup({ id: 'existing-enrollment' });

    await expect(
      service.bulkEnroll('owner-id', 'class-id', input),
    ).rejects.toEqual(
      new ConflictException('Enrollment overlaps an existing enrollment'),
    );
    expect(getCreatedData()).toBeUndefined();
  });
});
