'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { navigation } from '@/config/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

function Brand() {
  return (
    <Link href="/dashboard" className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-600/20"><GraduationCap aria-hidden="true" size={22} /></span>
      <span><span className="block text-lg font-extrabold tracking-tight text-slate-950">EduTrack</span><span className="block text-[10px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Teacher workspace</span></span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Điều hướng chính" className="space-y-1">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-[background-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500', active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-600 hover:translate-x-0.5 hover:bg-indigo-50 hover:text-indigo-700')}><Icon aria-hidden="true" size={18} />{label}</Link>;
      })}
    </nav>
  );
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  };
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <a href="#main-content" className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white focus:translate-y-0">Bỏ qua điều hướng</a>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 py-2"><Brand /></div>
        <p className="mt-8 mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Quản lý</p>
        <div className="flex-1"><NavLinks pathname={pathname} /></div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-teal-50 p-3">
          <p className="text-xs font-semibold text-slate-900">Không gian giáo viên</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Quản lý lớp học hiệu quả mỗi ngày.</p>
          <Button variant="ghost" onClick={logout} className="mt-2 w-full justify-start text-slate-600"><LogOut aria-hidden="true" size={17} />Đăng xuất</Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl lg:hidden">
          <Brand />
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild><Button variant="ghost" size="icon" aria-label="Mở menu"><Menu aria-hidden="true" /></Button></Dialog.Trigger>
            <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" /><Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(88vw,340px)] overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl focus:outline-none">
              <div className="flex items-center justify-between"><Brand /><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Đóng menu"><X aria-hidden="true" /></Button></Dialog.Close></div>
              <div className="mt-8"><NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} /></div>
              <Button variant="outline" onClick={logout} className="mt-8 w-full"><LogOut aria-hidden="true" size={17} />Đăng xuất</Button>
            </Dialog.Content></Dialog.Portal>
          </Dialog.Root>
        </header>
        <main id="main-content" className="min-w-0 p-4 pb-10 sm:p-6 lg:p-8 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
