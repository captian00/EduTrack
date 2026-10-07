import { noteRetentionStart, StudentNotesService } from './student-notes.service.js';

describe('Student note retention', () => {
  it('uses the same calendar day three months earlier', () => {
    expect(noteRetentionStart(new Date('2026-10-07T12:00:00+07:00'))).toBe('2026-07-07');
  });

  it('clamps month-end dates using calendar arithmetic', () => {
    expect(noteRetentionStart(new Date('2026-05-31T12:00:00+07:00'))).toBe('2026-02-28');
  });
});

describe('StudentNotesService.list', () => {
  it('merges student and attendance notes before sorting and pagination', async () => {
    const prisma = {
      student: { findFirst: () => Promise.resolve({ id: 'student-id' }) },
      studentNote: {
        deleteMany: () => Promise.resolve({ count: 0 }),
        findMany: () => Promise.resolve([{ id: 'note-id', content: 'Tiến bộ tốt', noteDate: new Date('2026-10-06'), createdAt: new Date('2026-10-06T09:00:00Z'), lesson: null }]),
      },
      attendance: {
        findMany: () => Promise.resolve([{ id: 'attendance-id', note: 'Đi muộn 15 phút', createdAt: new Date('2026-10-07T08:00:00Z'), lesson: { id: 'lesson-id', lessonDate: new Date('2026-10-07'), class: { name: 'Toán 6' } } }]),
      },
    };
    const service = new StudentNotesService(prisma as never);
    const result = await service.list('owner-id', 'student-id', { page: 1, pageSize: 20 });
    expect(result.meta.total).toBe(2);
    expect(result.items[0]).toMatchObject({ source: 'ATTENDANCE', editable: false, deletable: false, lesson: { className: 'Toán 6' } });
    expect(result.items[1]).toMatchObject({ source: 'STUDENT_NOTE', editable: true, deletable: true });
  });
});
