import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Table({ className, ...props }: ComponentProps<'table'>) { return <div className="relative w-full overflow-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>; }
export function TableHeader(props: ComponentProps<'thead'>) { return <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs font-semibold tracking-wide text-slate-500 uppercase backdrop-blur" {...props} />; }
export function TableBody(props: ComponentProps<'tbody'>) { return <tbody className="[&_tr:last-child]:border-0" {...props} />; }
export function TableRow({ className, ...props }: ComponentProps<'tr'>) { return <tr className={cn('border-b border-slate-100 transition-colors hover:bg-slate-50/70', className)} {...props} />; }
export function TableHead({ className, ...props }: ComponentProps<'th'>) { return <th className={cn('h-12 px-4 text-left align-middle', className)} {...props} />; }
export function TableCell({ className, ...props }: ComponentProps<'td'>) { return <td className={cn('p-4 align-middle', className)} {...props} />; }
