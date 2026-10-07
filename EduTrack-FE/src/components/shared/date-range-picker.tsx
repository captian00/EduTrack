'use client';
import { CalendarDays } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const parse = (value?: string) => value ? new Date(`${value}T00:00:00`) : undefined;
const serialize = (value?: Date) => value ? `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}` : '';
export function DateRangePicker({ from, to, onChange }: { from?: string; to?: string; onChange: (range: { from: string; to: string }) => void }) {
  const selected = { from: parse(from), to: parse(to) } as DateRange;
  const label = from ? `${formatDate(parse(from)!)}${to ? ` – ${formatDate(parse(to)!)}` : ''}` : 'Chọn khoảng ngày';
  return <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-medium"><CalendarDays aria-hidden="true" size={17} /><span className="truncate">{label}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-auto p-2"><DayPicker mode="range" locale={vi} weekStartsOn={1} selected={selected} onSelect={(range) => onChange({ from: serialize(range?.from), to: serialize(range?.to) })} className="p-2" classNames={{ months:'flex flex-col gap-4', month:'space-y-3', month_caption:'flex justify-center font-semibold py-2', nav:'flex items-center justify-between absolute inset-x-3 top-3', button_previous:'size-9 rounded-lg hover:bg-slate-100', button_next:'size-9 rounded-lg hover:bg-slate-100', weekdays:'flex', weekday:'w-10 text-center text-xs text-slate-400', week:'flex mt-1', day:'size-10 text-center', day_button:'size-10 rounded-lg hover:bg-indigo-50 hover:text-indigo-700', selected:'bg-indigo-600 text-white rounded-lg', range_middle:'bg-indigo-50 text-indigo-800 rounded-none', today:'font-bold text-indigo-700' }} /></PopoverContent></Popover>;
}

export function DatePicker({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const selected = parse(value);
  return <Popover><PopoverTrigger asChild><Button variant="outline" className="mt-2 w-full justify-start font-medium"><CalendarDays aria-hidden="true" size={17} />{selected ? formatDate(selected) : 'Chọn ngày'}</Button></PopoverTrigger><PopoverContent align="start" className="w-auto p-2"><DayPicker mode="single" locale={vi} weekStartsOn={1} selected={selected} onSelect={(date) => onChange(serialize(date))} className="p-2" classNames={{ months:'flex flex-col gap-4', month:'space-y-3', month_caption:'flex justify-center font-semibold py-2', nav:'flex items-center justify-between absolute inset-x-3 top-3', button_previous:'size-9 rounded-lg hover:bg-slate-100', button_next:'size-9 rounded-lg hover:bg-slate-100', weekdays:'flex', weekday:'w-10 text-center text-xs text-slate-400', week:'flex mt-1', day:'size-10 text-center', day_button:'size-10 rounded-lg hover:bg-indigo-50 hover:text-indigo-700', selected:'bg-indigo-600 text-white rounded-lg', today:'font-bold text-indigo-700' }} /></PopoverContent></Popover>;
}
