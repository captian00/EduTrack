import { Suspense } from 'react';
import { ClassesScreen } from '@/features/classes/classes-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function ClassesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassesScreen />
    </Suspense>
  );
}
