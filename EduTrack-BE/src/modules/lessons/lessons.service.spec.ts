import { ConflictException } from '@nestjs/common';
import { LessonsService } from './lessons.service.js';

describe('LessonsService', () => {
  it('returns a business conflict before inserting a duplicate lesson', async () => {
    let createCalled = false;
    const prisma = {
      class: { findFirst: () => Promise.resolve({ id: 'class-id' }) },
      lesson: { findFirst: () => Promise.resolve({ id: 'existing-id' }), create: () => { createCalled = true; return Promise.resolve(); } },
    };
    const service = new LessonsService(prisma as never);
    await expect(service.create('owner-id', { classId: 'class-id', lessonDate: '2026-10-07', startTime: '15:04', topic: 'Không có chủ đề' })).rejects.toEqual(new ConflictException('LESSON_ALREADY_EXISTS'));
    expect(createCalled).toBe(false);
  });
});
