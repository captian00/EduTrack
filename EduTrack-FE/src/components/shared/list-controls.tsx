'use client';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
type FilterPanelProps = {
  children: ReactNode;
  activeCount?: number;
  onApply?: () => void;
  onReset?: () => void;
  onOpenChange?: (open: boolean) => void;
  validationMessage?: string;
};

export function FilterPanel({
  children,
  activeCount = 0,
  onApply,
  onReset,
  onOpenChange,
  validationMessage,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const desktop = useMediaQuery('(min-width: 768px)');
  const changeOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const trigger = (
    <Button
      variant="outline"
      className="shrink-0 bg-white"
      aria-label={`Bộ lọc${activeCount ? `, ${activeCount} đang áp dụng` : ''}`}
    >
      <SlidersHorizontal aria-hidden="true" size={17} />
      Bộ lọc
      {activeCount > 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-indigo-600 text-[11px] text-white">
          {activeCount}
        </span>
      )}
    </Button>
  );
  const content = (
    <>
      <div className="space-y-4">{children}</div>
      {validationMessage && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
          {validationMessage}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={16} />
          Đặt lại
        </Button>
        <Button
          className="flex-1"
          disabled={Boolean(validationMessage)}
          onClick={() => {
            onApply?.();
            changeOpen(false);
          }}
        >
          Áp dụng
        </Button>
      </div>
    </>
  );
  if (desktop)
    return (
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[min(92vw,520px)]">
          {content}
        </PopoverContent>
      </Popover>
    );
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bộ lọc</DialogTitle>
          <DialogDescription>
            Thu hẹp danh sách theo thông tin bạn cần.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export function ActiveFilterChips({
  filters,
  onRemove,
  onClear,
}: {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  if (!filters.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onRemove(filter.key)}
          className="rounded-full"
        >
          {filter.label}
          <X aria-hidden="true" size={13} />
        </Button>
      ))}
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        Xóa tất cả
      </Button>
    </div>
  );
}
export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <nav
      aria-label="Phân trang"
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <p className="text-sm text-slate-500">
        Trang <strong className="text-slate-900">{meta.page}</strong>/
        {meta.totalPages} · {meta.total} kết quả
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Trước
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
export const tableIndex = (
  meta: Pick<PageMeta, 'page' | 'pageSize'>,
  index: number,
) => (meta.page - 1) * meta.pageSize + index + 1;
