'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading';
import {
  ActiveFilterChips,
  FilterPanel,
  Pagination,
  tableIndex,
  type PageMeta,
} from '@/components/shared/list-controls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/api-client';
import { useListParams } from '@/lib/hooks/use-list-params';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
type Summary = {
  items: {
    student: { id: string; fullName: string; studentCode: string };
    outstanding: number;
  }[];
};
type Payment = {
  id: string;
  amount: number;
  paidAt: string;
  method: string;
  status: string;
  student: { fullName: string };
  voidReason: string | null;
};
type Qr = {
  imageUrl: string;
  description: string;
  fullDescription: string;
  amount: number;
};
type Preview = { allocations: { attendanceId: string; amount: number }[] };
const money = formatCurrency;
export function PaymentsScreen() {
  const params = useListParams();
  const client = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [qr, setQr] = useState<Qr>();
  const [preview, setPreview] = useState<Preview>();
  const [voidId, setVoidId] = useState<string>();
  const [voidReason, setVoidReason] = useState('');
  const filterStudentId = params.get('studentId');
  const rawStatus = params.get('status');
  const filterStatus = ['CONFIRMED', 'VOIDED'].includes(rawStatus)
    ? rawStatus
    : '';
  const rawMethod = params.get('method');
  const filterMethod = ['BANK_TRANSFER', 'CASH', 'OTHER'].includes(rawMethod)
    ? rawMethod
    : '';
  const from = params.get('from');
  const to = params.get('to');
  const [filterDraft, setFilterDraft] = useState({
    studentId: filterStudentId,
    status: filterStatus,
    method: filterMethod,
    from,
    to,
  });
  const summary = useQuery({
    queryKey: ['tuition', 'summary'],
    queryFn: async () =>
      (
        await apiClient.get<Summary>('/tuition/summary', {
          params: { pageSize: 100 },
        })
      ).data,
  });
  const paymentParams = {
    studentId: filterStudentId || undefined,
    status: filterStatus || undefined,
    method: filterMethod || undefined,
    from: from || undefined,
    to: to || undefined,
    page: params.page,
    pageSize: params.pageSize,
  };
  const payments = useQuery({
    queryKey: ['payments', paymentParams],
    queryFn: async () =>
      (
        await apiClient.get<{ items: Payment[]; meta: PageMeta }>('/payments', {
          params: paymentParams,
        })
      ).data,
    placeholderData: (old) => old,
    enabled: !(from && to && from > to),
  });
  const save = useMutation({
    mutationFn: () =>
      apiClient.post('/payments', {
        studentId,
        amount: Number(amount),
        paidAt: new Date().toISOString(),
        method,
      }),
    onSuccess: async () => {
      toast.success('Đã ghi nhận thanh toán');
      setAmount('');
      setPreview(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['payments'] }),
        client.invalidateQueries({ queryKey: ['tuition'] }),
      ]);
    },
  });
  const previewPayment = async () => {
    try {
      setPreview(
        (
          await apiClient.post<Preview>('/payments/preview', {
            studentId,
            amount: Number(amount),
            paidAt: new Date().toISOString(),
            method,
          })
        ).data,
      );
    } catch {
      toast.error('Số tiền không hợp lệ hoặc vượt công nợ.');
    }
  };
  const generateQr = async () => {
    try {
      setQr(
        (
          await apiClient.post<Qr>('/qr-payments/generate', {
            studentId,
            amount: Number(amount),
          })
        ).data,
      );
    } catch {
      toast.error('Không thể tạo QR. Kiểm tra cài đặt ngân hàng và công nợ.');
    }
  };
  const voidPayment = async () => {
    if (!voidId || !voidReason.trim()) return;
    await apiClient.post(`/payments/${voidId}/void`, {
      reason: voidReason.trim(),
    });
    toast.success('Đã void payment');
    await Promise.all([
      client.invalidateQueries({ queryKey: ['payments'] }),
      client.invalidateQueries({ queryKey: ['tuition'] }),
    ]);
    setVoidId(undefined);
    setVoidReason('');
  };
  if (summary.isPending || payments.isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Tài chính"
        title="Thanh toán"
        description="Ghi nhận thanh toán, xem trước phân bổ công nợ và tạo VietQR."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void previewPayment();
        }}
        className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-3 sm:items-end"
      >
        <label className="text-sm font-medium">
          Học sinh
          <Select
            value={studentId}
            onValueChange={(value) => {
              setStudentId(value);
              setPreview(undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn học sinh" />
            </SelectTrigger>
            <SelectContent>
              {summary.data?.items
                .filter((x) => x.outstanding > 0)
                .map((x) => (
                  <SelectItem key={x.student.id} value={x.student.id}>
                    {x.student.fullName} — nợ {money(x.outstanding)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          Số tiền
          <CurrencyInput
            value={amount}
            onValueChange={(value) => {
              setAmount(value);
              setPreview(undefined);
            }}
            required
            className="mt-2"
          />
        </label>
        <label className="text-sm font-medium">
          Phương thức
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
              <SelectItem value="CASH">Tiền mặt</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:col-span-3 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" disabled={!studentId || !amount}>
            Ghi nhận thanh toán
          </Button>
          <Button
            type="button"
            onClick={generateQr}
            variant="outline"
            disabled={!studentId || !amount}
            className="w-full sm:w-auto"
          >
            Tạo mã QR
          </Button>
        </div>
      </form>
      {preview && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-950">Xác nhận phân bổ</h2>
          <p className="mt-1 text-sm text-blue-800">
            Khoản tiền sẽ được phân bổ vào {preview.allocations.length} buổi học
            cũ nhất.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-900">
            {preview.allocations.map((item, index) => (
              <li key={item.attendanceId}>
                Khoản {index + 1}: {money(item.amount)}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            className="mt-4"
          >
            Xác nhận thanh toán
          </Button>
        </section>
      )}
      {qr && (
        <section className="rounded-2xl border bg-white p-5 text-center">
          <Image
            src={qr.imageUrl}
            alt="Mã VietQR thanh toán"
            width={256}
            height={256}
            unoptimized
            className="mx-auto size-64"
          />
          <p className="mt-3 font-semibold">{money(qr.amount)}</p>
          <dl className="mx-auto mt-4 max-w-xl space-y-3 text-left text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="font-semibold text-slate-700">
                Nội dung trong QR
              </dt>
              <dd className="mt-1 break-words text-slate-600">
                {qr.description}
              </dd>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3">
              <dt className="font-semibold text-indigo-800">Nội dung đầy đủ</dt>
              <dd className="mt-1 break-words text-indigo-700">
                {qr.fullDescription}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-amber-700">
            Tạo QR không tự xác nhận thanh toán.
          </p>
        </section>
      )}
      <FilterPanel
        activeCount={
          [filterStudentId, filterStatus, filterMethod, from, to].filter(
            Boolean,
          ).length
        }
        onOpenChange={(open) =>
          open &&
          setFilterDraft({
            studentId: filterStudentId,
            status: filterStatus,
            method: filterMethod,
            from,
            to,
          })
        }
        onReset={() =>
          setFilterDraft({
            studentId: '',
            status: '',
            method: '',
            from: '',
            to: '',
          })
        }
        onApply={() => params.update(filterDraft)}
        validationMessage={
          filterDraft.from &&
          filterDraft.to &&
          filterDraft.from > filterDraft.to
            ? 'Ngày bắt đầu phải trước ngày kết thúc.'
            : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Học sinh
            <Select
              value={filterDraft.studentId}
              onValueChange={(value) =>
                setFilterDraft((old) => ({
                  ...old,
                  studentId: value === 'ALL' ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {summary.data?.items.map((x) => (
                  <SelectItem key={x.student.id} value={x.student.id}>
                    {x.student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Trạng thái
            <Select
              value={filterDraft.status}
              onValueChange={(value) =>
                setFilterDraft((old) => ({
                  ...old,
                  status: value === 'ALL' ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                <SelectItem value="VOIDED">Đã void</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Phương thức
            <Select
              value={filterDraft.method}
              onValueChange={(value) =>
                setFilterDraft((old) => ({
                  ...old,
                  method: value === 'ALL' ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                <SelectItem value="CASH">Tiền mặt</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div>
            <p className="mb-2 text-sm font-semibold">Khoảng ngày</p>
            <DateRangePicker
              from={filterDraft.from}
              to={filterDraft.to}
              onChange={(range) =>
                setFilterDraft((old) => ({ ...old, ...range }))
              }
            />
          </div>
        </div>
      </FilterPanel>
      <ActiveFilterChips
        filters={[
          { key: 'studentId', label: filterStudentId ? 'Theo học sinh' : '' },
          {
            key: 'status',
            label:
              filterStatus === 'CONFIRMED'
                ? 'Đã xác nhận'
                : filterStatus === 'VOIDED'
                  ? 'Đã void'
                  : '',
          },
          {
            key: 'method',
            label:
              filterMethod === 'BANK_TRANSFER'
                ? 'Chuyển khoản'
                : filterMethod === 'CASH'
                  ? 'Tiền mặt'
                  : filterMethod === 'OTHER'
                    ? 'Khác'
                    : '',
          },
          { key: 'from', label: from ? `Từ ${from}` : '' },
          { key: 'to', label: to ? `Đến ${to}` : '' },
        ].filter((x) => x.label)}
        onRemove={(key) => params.update({ [key]: undefined })}
        onClear={() => params.clear()}
      />
      {from && to && from > to && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700"
        >
          Ngày bắt đầu phải trước ngày kết thúc.
        </p>
      )}
      <div className="hidden overflow-hidden rounded-2xl border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Học sinh</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.data?.items.map((p, index) => (
              <TableRow key={p.id}>
                <TableCell className="text-slate-500 tabular-nums">
                  {tableIndex(payments.data!.meta, index)}
                </TableCell>
                <TableCell>{formatDateTime(p.paidAt)}</TableCell>
                <TableCell>{p.student.fullName}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {money(p.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={p.status === 'CONFIRMED' ? 'success' : 'danger'}
                  >
                    {p.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã void'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {p.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      variant="dangerOutline"
                      onClick={() => setVoidId(p.id)}
                    >
                      Void
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payments.data?.items.length === 0 && (
          <p className="p-8 text-center text-slate-500">Chưa có thanh toán.</p>
        )}
      </div>
      <div className="grid gap-3 md:hidden">
        {payments.data?.items.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{p.student.fullName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(p.paidAt)}
                </p>
              </div>
              <Badge variant={p.status === 'CONFIRMED' ? 'success' : 'danger'}>
                {p.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã void'}
              </Badge>
            </div>
            <p className="mt-4 text-xl font-extrabold text-indigo-700 tabular-nums">
              {money(p.amount)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {p.method === 'BANK_TRANSFER'
                ? 'Chuyển khoản'
                : p.method === 'CASH'
                  ? 'Tiền mặt'
                  : 'Khác'}
            </p>
            {p.status === 'CONFIRMED' && (
              <Button
                variant="dangerOutline"
                className="mt-3 w-full"
                onClick={() => setVoidId(p.id)}
              >
                Void thanh toán
              </Button>
            )}
          </Card>
        ))}
      </div>
      {payments.data && (
        <Pagination
          meta={payments.data.meta}
          onPageChange={(page) => params.update({ page }, false)}
        />
      )}
      <Dialog
        open={Boolean(voidId)}
        onOpenChange={(open) => !open && setVoidId(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void thanh toán?</DialogTitle>
            <DialogDescription>
              Khoản phân bổ sẽ bị vô hiệu và công nợ tương ứng được khôi phục.
              Lịch sử thanh toán vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-semibold text-slate-700">
            Lý do void
            <Textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={4}
              required
              placeholder="Nhập lý do điều chỉnh…"
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVoidId(undefined)}>
              Quay lại
            </Button>
            <Button
              variant="destructive"
              disabled={!voidReason.trim()}
              onClick={() => void voidPayment()}
            >
              Xác nhận void
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
