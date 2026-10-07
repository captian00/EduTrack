import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.18em] text-indigo-600 uppercase">{eyebrow}</p>}
        <h1 className="text-[1.65rem] leading-tight font-extrabold tracking-tight text-balance text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-pretty text-slate-500 sm:text-sm">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
