import { Suspense } from 'react';
import { PaymentsScreen } from '@/features/payments/payments-screen';
import { PageSkeleton } from '@/components/shared/loading';

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PaymentsScreen />
    </Suspense>
  );
}
