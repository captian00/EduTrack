'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
export function SheetContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-safe:transition-opacity" /><DialogPrimitive.Content className={cn('fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden overscroll-contain rounded-t-3xl border bg-white shadow-2xl focus:outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(42rem,calc(100vw-2rem))] sm:rounded-none sm:rounded-l-3xl', className)} {...props}>{children}<DialogPrimitive.Close aria-label="Đóng" className="absolute top-4 right-4 grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X aria-hidden="true" size={18} /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}
