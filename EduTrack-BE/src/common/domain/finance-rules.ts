import { AttendanceStatus } from '@prisma/client';

export function isBillableAttendance(
  status: AttendanceStatus,
  policy = { billExcusedAbsence: false, billUnexcusedAbsence: true },
) {
  if (status === AttendanceStatus.PRESENT) return true;
  if (status === AttendanceStatus.ABSENT_EXCUSED)
    return policy.billExcusedAbsence;
  if (status === AttendanceStatus.ABSENT_UNEXCUSED)
    return policy.billUnexcusedAbsence;
  return false;
}

export function allocateOldestFirst(
  charges: { attendanceId: string; outstanding: number }[],
  amount: number,
) {
  let remaining = amount;
  return charges.flatMap((charge) => {
    if (remaining <= 0) return [];
    const allocated = Math.min(remaining, charge.outstanding);
    remaining -= allocated;
    return [{ attendanceId: charge.attendanceId, amount: allocated }];
  });
}
