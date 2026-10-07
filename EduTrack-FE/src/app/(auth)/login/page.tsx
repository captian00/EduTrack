import { BookOpenCheck, CalendarCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-32 -left-24 size-96 rounded-full border border-white/10 bg-white/5" />
        <div className="relative flex items-center gap-3 text-xl font-extrabold"><span className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur"><GraduationCap aria-hidden="true" /></span>EduTrack</div>
        <div className="relative max-w-xl"><p className="text-sm font-bold tracking-[0.2em] text-indigo-100 uppercase">Teacher workspace</p><h1 className="mt-4 text-5xl leading-tight font-extrabold text-balance">Mỗi lớp học,<br />một hành trình rõ ràng.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-indigo-100">Tập trung hồ sơ, điểm danh và học phí trong một không gian quản lý đơn giản.</p><div className="mt-10 grid grid-cols-3 gap-3">{[[BookOpenCheck,'Quản lý lớp'],[CalendarCheck,'Điểm danh'],[ShieldCheck,'Dữ liệu an toàn']].map(([Icon,label]) => { const FeatureIcon = Icon as typeof BookOpenCheck; return <div key={label as string} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><FeatureIcon aria-hidden="true" /><p className="mt-3 text-sm font-semibold">{label as string}</p></div>; })}</div></div>
        <p className="relative text-xs text-indigo-200">EduTrack · Dành cho giáo viên hiện đại</p>
      </section>
      <section className="grid place-items-center p-4 sm:p-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/8 sm:p-9">
        <div className="mb-8 flex items-center gap-3 text-xl font-extrabold text-indigo-700 lg:hidden">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap aria-hidden="true" />
          </span>
          EduTrack
        </div>
        <p className="text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase">Chào mừng trở lại</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-500">
          Đăng nhập bằng tài khoản quản trị để tiếp tục.
        </p>
        <LoginForm />
      </div>
      </section>
    </main>
  );
}
