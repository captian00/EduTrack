import { describe, expect, it } from 'vitest';
import { countAttendanceStatuses } from './attendance-summary';
describe('countAttendanceStatuses', () => {
  it('counts every attendance state', () => {
    expect(countAttendanceStatuses([{ status: 'PRESENT' }, { status: 'PRESENT' }, { status: 'ABSENT_EXCUSED' }, { status: 'MAKEUP' }])).toEqual({ PRESENT: 2, ABSENT_EXCUSED: 1, ABSENT_UNEXCUSED: 0, MAKEUP: 1 });
  });
});
