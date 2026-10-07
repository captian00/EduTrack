import { Suspense } from 'react';
import { StudentsScreen } from '@/features/students/components/students-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function StudentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudentsScreen />
    </Suspense>
  );
}
