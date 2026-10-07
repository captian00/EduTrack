'use client';
import { useQuery } from '@tanstack/react-query';
import { Banknote, BookOpen, CalendarCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/api-client';
import { formatCurrency } from '@/lib/utils';
type Summary = {
  activeStudents: number;
  activeClasses: number;
  todayLessons: number;
  tuition: { outstanding: number };
};
export function DashboardOverview() {
  const query = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () =>
      (await apiClient.get<Summary>('/dashboard/summary')).data,
  });
  const data = query.data;
  const summaries = [
    {
      label: 'Học sinh hoạt động',
      value: data?.activeStudents ?? '—',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
      cardColor: 'border-blue-100 bg-blue-50/70',
    },
    {
      label: 'Lớp đang dạy',
      value: data?.activeClasses ?? '—',
      icon: BookOpen,
      color: 'bg-violet-50 text-violet-700',
      cardColor: 'border-violet-100 bg-violet-50/70',
    },
    {
      label: 'Buổi học hôm nay',
      value: data?.todayLessons ?? '—',
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-700',
      cardColor: 'border-emerald-100 bg-emerald-50/70',
    },
    {
      label: 'Công nợ học phí',
      value: data ? formatCurrency(data.tuition.outstanding) : '—',
      icon: Banknote,
      color: 'bg-amber-50 text-amber-700',
      cardColor: 'border-amber-100 bg-amber-50/70',
    },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <PageHeader eyebrow="EduTrack" title="Tổng quan hôm nay" description="Theo dõi lớp học, điểm danh và học phí trong một không gian thống nhất." actions={<><Button asChild><Link href="/lessons">Chọn buổi điểm danh</Link></Button><Button asChild variant="outline"><Link href="/students">Thêm học sinh</Link></Button></>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(({ label, value, icon: Icon, color, cardColor }) => (
          <Card
            key={label}
            className={`group p-5 text-center sm:text-left ${cardColor} transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5`}
          >
            <div
              className={`mx-auto grid size-14 place-items-center rounded-2xl shadow-sm sm:mx-0 ${color}`}
            >
              <Icon aria-hidden="true" size={28} strokeWidth={2.2} />
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            {query.isPending ? <Skeleton className="mx-auto mt-2 h-8 w-24 sm:mx-0" /> : <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>}
          </Card>
        ))}
      </section>
      {query.isError && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Không tải được số liệu dashboard.
        </p>
      )}
    </div>
  );
}
