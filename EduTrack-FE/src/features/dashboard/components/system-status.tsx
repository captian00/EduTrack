'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading';

import { getApiHealth } from '../api/dashboard.api';
import { dashboardKeys } from '../api/dashboard.keys';

export function SystemStatus() {
  const healthQuery = useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: getApiHealth,
    refetchInterval: 30_000,
  });

  if (healthQuery.isPending) {
    return <LoadingSpinner label="Đang kiểm tra kết nối hệ thống" />;
  }

  if (healthQuery.isError) {
    return (
      <section className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <TriangleAlert className="shrink-0 text-amber-700" />
        <div>
          <h2 className="font-semibold text-amber-950">
            Không kết nối được Backend
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Kiểm tra Backend đang chạy ở cổng 3001 và cấu hình API URL của
            Frontend.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <CircleCheck className="shrink-0 text-emerald-700" />
      <div>
        <h2 className="font-semibold text-emerald-950">Hệ thống đã kết nối</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Frontend và Backend đang hoạt động bình thường.
        </p>
      </div>
    </section>
  );
}
