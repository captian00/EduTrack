'use client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ActiveFilterChips,
  FilterPanel,
  Pagination,
  tableIndex,
  type PageMeta,
} from '@/components/shared/list-controls';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api/api-client';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useListParams } from '@/lib/hooks/use-list-params';
import { formatCurrency } from '@/lib/utils';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TuitionState = 'UNPAID' | 'PARTIAL' | 'PAID';
type Row = {
  student: { id: string; studentCode: string; fullName: string };
  charged: number;
  paid: number;
  outstanding: number;
  paymentState: TuitionState;
};
type Summary = {
  items: Row[];
  totals: { charged: number; paid: number; outstanding: number };
  meta: PageMeta;
};
const stateLabel = {
  UNPAID: 'Chưa thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
} as const;

export function TuitionScreen() {
  const params = useListParams();
  const [search, setSearch] = useState(() => params.get('search'));
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const rawPaymentState = params.get('paymentState');
  const paymentState = (['UNPAID', 'PARTIAL', 'PAID'] as const).includes(
    rawPaymentState as TuitionState,
  )
    ? (rawPaymentState as TuitionState)
    : '';
  const from = params.get('from');
  const to = params.get('to');
  const [draft, setDraft] = useState({ paymentState, from, to });
  useEffect(() => {
    if (debouncedSearch !== params.get('search'))
      params.update({ search: debouncedSearch });
  }, [debouncedSearch, params]);
  const queryParams = {
    search: params.get('search') || undefined,
    paymentState: paymentState || undefined,
    from: from || undefined,
    to: to || undefined,
    page: params.page,
    pageSize: params.pageSize,
  };
  const query = useQuery({
    queryKey: ['tuition', 'summary', queryParams],
    queryFn: async () =>
      (
        await apiClient.get<Summary>('/tuition/summary', {
          params: queryParams,
        })
      ).data,
    placeholderData: (old) => old,
    enabled: !(from && to && from > to),
  });
  const filters = [
    {
      key: 'paymentState',
      label: paymentState ? stateLabel[paymentState] : '',
    },
    { key: 'from', label: from ? `Từ ${from}` : '' },
    { key: 'to', label: to ? `Đến ${to}` : '' },
  ].filter((x) => x.label);
  const filterFields = (
    <div className="grid gap-4">
      <label className="text-sm font-semibold">
        Trạng thái
        <Select
          value={draft.paymentState}
          onValueChange={(value) =>
            setDraft((old) => ({
              ...old,
              paymentState: value === 'ALL' ? '' : (value as TuitionState),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
            <SelectItem value="PARTIAL">Thanh toán một phần</SelectItem>
            <SelectItem value="PAID">Đã thanh toán</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold">Khoảng ngày</p>
        <DateRangePicker
          from={draft.from}
          to={draft.to}
          onChange={(range) => setDraft((old) => ({ ...old, ...range }))}
        />
      </div>
    </div>
  );
  if (query.isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Tài chính"
        title="Học phí"
        description="Công nợ được tính tự động từ các buổi điểm danh có tính phí."
      />
      <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border bg-slate-50/60 px-3">
          <Search aria-hidden="true" size={18} className="text-slate-400" />
          <span className="sr-only">Tìm học sinh</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc mã học sinh…"
            className="mt-0 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
          />
        </label>
        <FilterPanel
          activeCount={filters.length}
          onOpenChange={(open) => open && setDraft({ paymentState, from, to })}
          onReset={() => setDraft({ paymentState: '', from: '', to: '' })}
          onApply={() => params.update(draft)}
          validationMessage={
            draft.from && draft.to && draft.from > draft.to
              ? 'Ngày bắt đầu phải trước ngày kết thúc.'
              : undefined
          }
        >
          {filterFields}
        </FilterPanel>
      </Card>
      <ActiveFilterChips
        filters={filters}
        onRemove={(key) => params.update({ [key]: undefined })}
        onClear={() => params.clear()}
      />
      {query.isError || !query.data ? (
        <Card className="p-8 text-center text-rose-700">
          Không tải được học phí.
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Phải thu', query.data.totals.charged],
              ['Đã thu', query.data.totals.paid],
              ['Còn nợ', query.data.totals.outstanding],
            ].map(([label, value]) => (
              <Card key={String(label)} className="p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">
                  {formatCurrency(Number(value))}
                </p>
              </Card>
            ))}
          </div>
          <div className="surface-table hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Học sinh</TableHead>
                  <TableHead className="text-right">Phải thu</TableHead>
                  <TableHead className="text-right">Đã thu</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((item, index) => (
                  <TableRow
                    key={item.student.id}
                    className="border-t border-slate-100"
                  >
                    <TableCell className="text-slate-500 tabular-nums">
                      {tableIndex(query.data.meta, index)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {item.student.studentCode} — {item.student.fullName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.charged)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-700 tabular-nums">
                      {formatCurrency(item.paid)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-700 tabular-nums">
                      {formatCurrency(item.outstanding)}
                    </TableCell>
                    <TableCell>
                      <StateBadge state={item.paymentState} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {query.data.items.map((item) => {
              const progress = item.charged
                ? Math.min(100, (item.paid / item.charged) * 100)
                : 100;
              return (
                <Card key={item.student.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{item.student.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {item.student.studentCode}
                      </p>
                    </div>
                    <StateBadge state={item.paymentState} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-500">Phải thu</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(item.charged)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Đã thu</dt>
                      <dd className="mt-1 font-semibold text-emerald-700 tabular-nums">
                        {formatCurrency(item.paid)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Còn nợ</dt>
                      <dd className="mt-1 font-semibold text-amber-700 tabular-nums">
                        {formatCurrency(item.outstanding)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              );
            })}
          </div>
          {!query.data.items.length && (
            <Card className="p-10 text-center text-slate-500">
              Không có kết quả phù hợp bộ lọc.
            </Card>
          )}
          <Pagination
            meta={query.data.meta}
            onPageChange={(page) => params.update({ page }, false)}
          />
        </>
      )}
    </div>
  );
}
function StateBadge({ state }: { state: TuitionState }) {
  return (
    <Badge
      variant={
        state === 'PAID'
          ? 'success'
          : state === 'PARTIAL'
            ? 'warning'
            : 'danger'
      }
    >
      {stateLabel[state]}
    </Badge>
  );
}
