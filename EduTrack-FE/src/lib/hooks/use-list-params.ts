'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useListParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const get = useCallback((key: string, fallback = '') => searchParams.get(key) ?? fallback, [searchParams]);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
  const update = useCallback((values: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage && !Object.hasOwn(values, 'page')) next.delete('page');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  }, [pathname, router, searchParams]);
  const clear = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);
  return { get, page, pageSize, update, clear, searchParams };
}
