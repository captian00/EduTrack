import { Suspense } from 'react';
import { LessonsScreen } from '@/features/lessons/lessons-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function LessonsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LessonsScreen />
    </Suspense>
  );
}
