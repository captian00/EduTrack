'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn('grid size-5 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-white shadow-sm outline-none transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-indigo-500/30 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600', className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator><Check aria-hidden="true" size={14} strokeWidth={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
