import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { navigation } from '@/config/navigation';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center gap-3 px-5 text-lg font-bold text-blue-700">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
            <GraduationCap size={22} />
          </span>
          EduTrack
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
