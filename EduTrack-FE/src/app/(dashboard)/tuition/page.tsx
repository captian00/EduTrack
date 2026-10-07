import { Suspense } from 'react';
import { TuitionScreen } from '@/features/tuition/tuition-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function TuitionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TuitionScreen />
    </Suspense>
  );
}
