'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
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
import {
  billingClasses,
  billingMonths,
  outstandingTuitionItems,
  selectedPeriodItems,
  type TuitionItem,
} from './payment-periods';
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
  billingMonth?: string;
  monthLabel: string;
  teacherName: string | null;
  classId?: string;
  className?: string;
  student: { id: string; studentCode: string; fullName: string };
  feePerSession: number | null;
  lessonCount: number;
  lessonDates: string[];
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string | null;
};
type TuitionDetail = {
  items: TuitionItem[];
};
type Preview = { allocations: { attendanceId: string; amount: number }[] };
const money = formatCurrency;
export function PaymentsScreen() {
  const params = useListParams();
  const client = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [classId, setClassId] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [qr, setQr] = useState<Qr>();
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLElement>(null);
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
  const tuitionDetail = useQuery({
    queryKey: ['tuition', 'student', studentId],
    queryFn: async () =>
      (await apiClient.get<TuitionDetail>(`/tuition/students/${studentId}`))
        .data,
    enabled: Boolean(studentId),
  });
  const outstandingItems = useMemo(
    () => outstandingTuitionItems(tuitionDetail.data?.items ?? []),
    [tuitionDetail.data],
  );
  const months = useMemo(
    () => billingMonths(outstandingItems),
    [outstandingItems],
  );
  const classes = useMemo(
    () => billingClasses(outstandingItems, billingMonth),
    [billingMonth, outstandingItems],
  );
  const selectedItems = useMemo(
    () => selectedPeriodItems(outstandingItems, billingMonth, classId),
    [billingMonth, classId, outstandingItems],
  );
  const selectedAmount = selectedItems.reduce(
    (sum, item) => sum + item.outstanding,
    0,
  );
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
        amount: selectedAmount,
        paidAt: new Date().toISOString(),
        method,
        billingMonth,
        classId,
      }),
    onSuccess: async () => {
      toast.success('Đã ghi nhận thanh toán');
      setPreview(undefined);
      setQr(undefined);
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
            amount: selectedAmount,
            paidAt: new Date().toISOString(),
            method,
            billingMonth,
            classId,
          })
        ).data,
      );
    } catch {}
  };
  const generateQr = async () => {
    try {
      setQr(
        (
          await apiClient.post<Qr>('/qr-payments/generate', {
            studentId,
            amount: selectedAmount,
            billingMonth,
            classId,
          })
        ).data,
      );
    } catch {}
  };
  const downloadReceipt = async () => {
    if (!receiptRef.current || !qr) return;
    setIsDownloading(true);
    try {
      await document.fonts?.ready;
      await Promise.all(
        [...receiptRef.current.querySelectorAll('img')].map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve, reject) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => reject(), { once: true });
            });
          }
          await image.decode().catch(() => undefined);
        }),
      );
      const receipt = receiptRef.current;
      const width = Math.ceil(receipt.getBoundingClientRect().width);
      const height = Math.ceil(receipt.getBoundingClientRect().height);
      const dataUrl = await toPng(receipt, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          margin: '0',
          maxWidth: 'none',
          width: `${width}px`,
        },
      });
      const link = document.createElement('a');
      const safeClassName = (qr.className ?? 'lop-hoc')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
      link.download = `${qr.student.studentCode}-${safeClassName}-${qr.billingMonth ?? 'hoc-phi'}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error('Không thể tải phiếu. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
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
        className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2 sm:items-end lg:grid-cols-5"
      >
        <label className="text-sm font-medium">
          Học sinh
          <Select
            value={studentId}
            onValueChange={(value) => {
              setStudentId(value);
              setBillingMonth('');
              setClassId('');
              setPreview(undefined);
              setQr(undefined);
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
          Tháng học phí
          <Select
            value={billingMonth}
            onValueChange={(value) => {
              setBillingMonth(value);
              setClassId('');
              setPreview(undefined);
              setQr(undefined);
            }}
            disabled={!studentId || tuitionDetail.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tháng" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  Tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          Lớp học
          <Select
            value={classId}
            onValueChange={(value) => {
              setClassId(value);
              setPreview(undefined);
              setQr(undefined);
            }}
            disabled={!billingMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          Tổng học phí
          <div className="mt-2 flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-800 tabular-nums">
            {selectedAmount ? money(selectedAmount) : '—'}
          </div>
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
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-5">
          <Button
            className="w-full sm:w-auto"
            disabled={!studentId || !billingMonth || !classId || !selectedAmount}
          >
            Ghi nhận thanh toán
          </Button>
          <Button
            type="button"
            onClick={generateQr}
            variant="outline"
            disabled={!studentId || !billingMonth || !classId || !selectedAmount}
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
        <div className="space-y-3">
          <section
            ref={receiptRef}
            className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-teal-200 bg-white text-slate-800 shadow-sm"
          >
            <header className="bg-gradient-to-br from-teal-500 to-cyan-500 px-5 py-5 text-center text-white md:px-8 md:py-6">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                {qr.teacherName || 'EduTrack'} · {qr.className || 'Lớp học'}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-wide">
                PHIẾU HỌC PHÍ
              </h2>
              <p className="mt-1 text-sm font-medium text-teal-50">
                {qr.monthLabel}
              </p>
            </header>

            <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_320px] md:p-8">
              <div className="min-w-0">
                <dl className="divide-y divide-dashed divide-slate-200 text-sm">
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-slate-500">🎓 Học sinh</dt>
                  <dd className="text-right font-semibold">
                    {qr.student.fullName}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-slate-500">💎 Học phí / buổi</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {qr.feePerSession === null
                      ? 'Nhiều mức'
                      : money(qr.feePerSession)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-slate-500">📝 Số buổi học</dt>
                  <dd className="text-right font-semibold">
                    {qr.lessonCount} buổi
                  </dd>
                </div>
                </dl>

              <div className="mt-3 rounded-2xl border-2 border-teal-200 bg-teal-50/70 px-4 py-4 text-center">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Tổng học phí
                </p>
                <p className="mt-1 text-3xl font-extrabold text-teal-700 tabular-nums">
                  {money(qr.amount)}
                </p>
              </div>

                <div className="mt-5 text-center md:text-left">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Ngày đi học
                </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5 md:justify-start">
                  {qr.lessonDates.map((date, index) => {
                    const [year, month, day] = date.slice(0, 10).split('-');
                    return (
                      <span
                        key={`${date}-${index}`}
                        className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700"
                      >
                        {day}/{month}
                        <span className="sr-only">/{year}</span>
                      </span>
                    );
                  })}
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">
                    Thông tin học phí
                  </p>
                  <p className="mt-1 break-words">{qr.fullDescription}</p>
                </div>
              </div>

              <div className="mx-auto min-w-0 w-full max-w-[320px] self-start overflow-hidden rounded-2xl border-2 border-dashed border-teal-400 p-4 text-center">
                <p className="text-xs font-bold tracking-wide text-teal-700 uppercase">
                  Mã thanh toán
                </p>
                <Image
                  src={qr.imageUrl}
                  alt="Mã VietQR thanh toán"
                  width={256}
                  height={256}
                  unoptimized
                  crossOrigin="anonymous"
                  className="mx-auto mt-1 h-auto w-full max-w-56 object-contain"
                />
                <p className="mt-2 break-all text-sm font-bold text-rose-600">
                  {qr.bankCode} · {qr.bankAccountNumber}
                </p>
                {qr.bankAccountName && (
                  <p className="mt-0.5 text-xs font-semibold text-slate-600 uppercase">
                    {qr.bankAccountName}
                  </p>
                )}
                <p className="mt-2 break-words text-xs text-slate-500">
                  Nội dung: {qr.description}
                </p>
              </div>

            </div>
          </section>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              loading={isDownloading}
              onClick={() => void downloadReceipt()}
            >
              Tải phiếu PNG
            </Button>
          </div>
        </div>
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
