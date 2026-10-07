import { LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function LoadingSpinner({
  label = 'Đang tải dữ liệu',
  className,
  size = 'default',
}: {
  label?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('grid place-items-center py-8 text-indigo-600', className)}
    >
      <LoaderCircle
        aria-hidden="true"
        className={cn(
          'animate-spin motion-reduce:animate-none',
          size === 'sm' ? 'size-4' : size === 'lg' ? 'size-8' : 'size-6',
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PageSkeleton({
  variant = 'list',
}: {
  variant?: 'list' | 'dashboard' | 'form';
}) {
  return (
    <main
      aria-busy="true"
      aria-label="Đang tải nội dung"
      className="mx-auto max-w-7xl space-y-5"
    >
      <span className="sr-only">Đang tải nội dung…</span>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 bg-indigo-100" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {variant === 'dashboard' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : null}
      {variant === 'form' ? (
        <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <Skeleton className="h-16 rounded-2xl" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
