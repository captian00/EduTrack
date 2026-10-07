import { describe, expect, it } from 'vitest';
import { studentSchema } from './student.schema';
describe('studentSchema', () => {
  it('requires a meaningful student name', () =>
    expect(studentSchema.safeParse({ fullName: 'A' }).success).toBe(false));
  it('accepts valid student details', () =>
    expect(
      studentSchema.safeParse({
        fullName: 'Nguyễn Văn An',
        parentPhone: '0900000000',
      }).success,
    ).toBe(true));
});
