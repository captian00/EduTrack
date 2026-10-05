import { Banknote, BookOpen, CalendarCheck, Users } from 'lucide-react';

const summaries = [
  { label: 'Học sinh hoạt động', value: '—', icon: Users, color: 'bg-blue-50 text-blue-700' },
  { label: 'Lớp đang dạy', value: '—', icon: BookOpen, color: 'bg-violet-50 text-violet-700' },
  { label: 'Buổi học hôm nay', value: '—', icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Công nợ học phí', value: '— ₫', icon: Banknote, color: 'bg-amber-50 text-amber-700' },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-700">EduTrack</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Tổng quan</h1>
        <p className="mt-2 text-sm text-slate-500">Theo dõi lớp học, điểm danh và học phí tại một nơi.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon size={20} /></div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="font-semibold">Sẵn sàng kết nối dữ liệu</h2>
        <p className="mt-2 text-sm text-slate-500">Hoàn tất cấu hình Supabase và Backend để bắt đầu quản lý lớp học.</p>
      </section>
    </div>
  );
}
