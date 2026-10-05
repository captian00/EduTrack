import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3 text-xl font-bold text-blue-700">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white"><GraduationCap /></span>
          EduTrack
        </div>
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-500">Đăng nhập bằng tài khoản quản trị để tiếp tục.</p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email
            <input type="email" autoComplete="email" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600" />
          </label>
          <label className="block text-sm font-medium">Mật khẩu
            <input type="password" autoComplete="current-password" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600" />
          </label>
          <button type="submit" className="min-h-11 w-full rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700">
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}
