export type AttendanceStatus = 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'MAKEUP';
export function countAttendanceStatuses(values: { status: AttendanceStatus }[]) {
  return values.reduce((result, item) => { result[item.status] += 1; return result; }, { PRESENT: 0, ABSENT_EXCUSED: 0, ABSENT_UNEXCUSED: 0, MAKEUP: 0 } as Record<AttendanceStatus, number>);
}
