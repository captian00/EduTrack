import { AttendanceStatus } from '@prisma/client';
import { allocateOldestFirst, isBillableAttendance } from './finance-rules.js';

describe('finance rules', () => {
  it.each([
    [AttendanceStatus.PRESENT, true],
    [AttendanceStatus.ABSENT_UNEXCUSED, true],
    [AttendanceStatus.ABSENT_EXCUSED, false],
    [AttendanceStatus.MAKEUP, false],
  ])('maps %s billing status', (status, expected) =>
    expect(isBillableAttendance(status)).toBe(expected),
  );

  it('allocates oldest charges first and supports a partial final charge', () => {
    expect(
      allocateOldestFirst(
        [
          { attendanceId: 'old', outstanding: 100 },
          { attendanceId: 'new', outstanding: 100 },
        ],
        150,
      ),
    ).toEqual([
      { attendanceId: 'old', amount: 100 },
      { attendanceId: 'new', amount: 50 },
    ]);
  });
});
