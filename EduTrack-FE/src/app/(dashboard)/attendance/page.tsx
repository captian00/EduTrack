import { Suspense } from 'react';
import { AttendanceScreen } from '@/features/attendance/attendance-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function AttendancePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AttendanceScreen />
    </Suspense>
  );
}
