'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toCanvas } from 'html-to-image';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  billingClasses,
  billingMonths as deriveBillingMonths,
  lessonDateLabels,
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
  selectedMonths: string[];
  monthLabel: string;
  teacherName: string | null;
  classCount: number;
  student: { id: string; studentCode: string; fullName: string };
  lessonCount: number;
  summary: PaymentAmounts;
  groups: {
    billingMonth: string;
    classId: string;
    className: string;
    lessonDates: string[];
    lessonCount: number;
    originalAmount: number;
    previouslyPaid: number;
    remainingAmount: number;
    priceTiers: (PaymentAmounts & {
      feePerSession: number;
      lessonCount: number;
      lessonDates: string[];
    })[];
  }[];
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string | null;
};
type PaymentAmounts = {
  originalAmount: number;
  previouslyPaid: number;
  remainingAmount: number;
};
type TuitionDetail = {
  items: TuitionItem[];
};
type Preview = { allocations: { attendanceId: string; amount: number }[] };
const money = formatCurrency;

function MultiSelect({
  values,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  values: string[];
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);
  const label =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `Đã chọn ${selectedLabels.length}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="mt-2 w-full justify-between px-3 font-normal"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
      >
        {options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">
            Không có công nợ phù hợp.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {options.map((option) => {
              const checked = values.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      onChange(
                        next
                          ? [...values, option.value]
                          : values.filter((value) => value !== option.value),
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function PaymentsScreen() {
  const params = useListParams();
  const client = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [billingMonths, setBillingMonths] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [qr, setQr] = useState<Qr>();
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLElement>(null);
  const receiptQrRef = useRef<HTMLImageElement>(null);
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
    () => deriveBillingMonths(outstandingItems),
    [outstandingItems],
  );
  const classes = useMemo(
    () => billingClasses(outstandingItems, billingMonths),
    [billingMonths, outstandingItems],
  );
  const selectedItems = useMemo(
    () => selectedPeriodItems(outstandingItems, billingMonths, classIds),
    [billingMonths, classIds, outstandingItems],
  );
  const selectedAmount = selectedItems.reduce(
    (sum, item) => sum + item.outstanding,
    0,
  );
  const selectedGroups = useMemo(() => {
    const values = new Map<
      string,
      { month: string; className: string; lessonCount: number; amount: number }
    >();
    selectedItems.forEach((item) => {
      const month = item.lesson.lessonDate.slice(0, 7);
      const key = `${month}:${item.lesson.class.id}`;
      const current = values.get(key) ?? {
        month,
        className: item.lesson.class.name,
        lessonCount: 0,
        amount: 0,
      };
      current.lessonCount += 1;
      current.amount += item.outstanding;
      values.set(key, current);
    });
    return [...values.values()];
  }, [selectedItems]);
  const qrImageUrl = qr
    ? `/api/vietqr-image?url=${encodeURIComponent(qr.imageUrl)}`
    : '';
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
        billingMonths,
        classIds,
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
            billingMonths,
            classIds,
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
            billingMonths,
            classIds,
          })
        ).data,
      );
    } catch {}
  };
  const downloadReceipt = async () => {
    if (!receiptRef.current || !receiptQrRef.current || !qr) return;
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
      const receiptQr = receiptQrRef.current;
      const receiptRect = receipt.getBoundingClientRect();
      const width = Math.ceil(receiptRect.width);
      const height = Math.ceil(receiptRect.height);
      const receiptCanvas = await toCanvas(receipt, {
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
      const qrRect = receiptQr.getBoundingClientRect();
      const context = receiptCanvas.getContext('2d');
      if (!context) throw new Error('Không thể tạo canvas phiếu học phí.');

      // Safari/WebKit đôi khi bỏ ảnh trong SVG foreignObject của html-to-image.
      // Vẽ lại QR từ phần tử đã tải trên trang để ảnh chia sẻ luôn có mã QR.
      const scaleX = receiptCanvas.width / receiptRect.width;
      const scaleY = receiptCanvas.height / receiptRect.height;
      context.drawImage(
        receiptQr,
        (qrRect.left - receiptRect.left) * scaleX,
        (qrRect.top - receiptRect.top) * scaleY,
        qrRect.width * scaleX,
        qrRect.height * scaleY,
      );

      const receiptBlob = await new Promise<Blob | null>((resolve) =>
        receiptCanvas.toBlob(resolve, 'image/png'),
      );
      if (!receiptBlob) throw new Error('Không thể tạo ảnh phiếu học phí.');

      const monthRange =
        qr.selectedMonths.length > 1
          ? `${qr.selectedMonths[0]}-${qr.selectedMonths.at(-1)}`
          : qr.selectedMonths[0] || 'hoc-phi';
      const fileName = `${qr.student.studentCode}-${monthRange}.png`;
      const receiptFile = new File([receiptBlob], fileName, {
        type: 'image/png',
      });
      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (
        isIos &&
        navigator.share &&
        navigator.canShare?.({ files: [receiptFile] })
      ) {
        try {
          await navigator.share({
            files: [receiptFile],
            title: 'Phiếu học phí',
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError')
            return;
        }
      }

      const objectUrl = URL.createObjectURL(receiptBlob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = objectUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
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
              setBillingMonths([]);
              setClassIds([]);
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
          <MultiSelect
            values={billingMonths}
            onChange={(values) => {
              setBillingMonths(values);
              const availableClassIds = new Set(
                billingClasses(outstandingItems, values).map((item) => item.id),
              );
              setClassIds((current) =>
                current.filter((id) => availableClassIds.has(id)),
              );
              setPreview(undefined);
              setQr(undefined);
            }}
            disabled={!studentId || tuitionDetail.isPending}
            placeholder="Chọn tháng"
            options={months.map((month) => ({
              value: month,
              label: `Tháng ${Number(month.slice(5, 7))}/${month.slice(0, 4)}`,
            }))}
          />
        </label>
        <label className="text-sm font-medium">
          Lớp học
          <MultiSelect
            values={classIds}
            onChange={(values) => {
              setClassIds(values);
              setPreview(undefined);
              setQr(undefined);
            }}
            disabled={billingMonths.length === 0}
            placeholder="Chọn lớp"
            options={classes.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
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
            disabled={
              !studentId ||
              !billingMonths.length ||
              !classIds.length ||
              !selectedAmount
            }
          >
            Ghi nhận thanh toán
          </Button>
          <Button
            type="button"
            onClick={generateQr}
            variant="outline"
            disabled={
              !studentId ||
              !billingMonths.length ||
              !classIds.length ||
              !selectedAmount
            }
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
            thuộc {billingMonths.length} tháng và{' '}
            {new Set(selectedItems.map((item) => item.lesson.class.id)).size}{' '}
            lớp.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-900">
            {selectedGroups.map((group) => (
              <li key={`${group.month}-${group.className}`}>
                Tháng {Number(group.month.slice(5, 7))}/
                {group.month.slice(0, 4)} · {group.className}:{' '}
                {group.lessonCount} buổi · {money(group.amount)}
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
                {qr.teacherName || 'EduTrack'}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-wide">
                PHIẾU HỌC PHÍ
              </h2>
              <p className="mt-1 text-sm font-medium text-teal-50">
                {qr.monthLabel}
              </p>
            </header>

            <div className="space-y-6 p-5 md:p-8">
              <dl className="grid gap-x-8 text-sm sm:grid-cols-2">
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-slate-500">Học sinh</dt>
                  <dd className="text-right font-semibold">
                    {qr.student.fullName}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-slate-500">Tháng học phí</dt>
                  <dd className="text-right font-semibold">
                    {qr.monthLabel.replace('Tháng ', '')}
                  </dd>
                </div>
              </dl>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Tháng · Lớp</th>
                      <th className="px-3 py-2 font-semibold">Ngày học</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Đơn giá × buổi
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {qr.groups.flatMap((group) =>
                      group.priceTiers.map((tier, tierIndex) => (
                        <tr
                          key={`${group.billingMonth}-${group.classId}-${tier.feePerSession}`}
                        >
                          <td className="px-3 py-3 align-top font-semibold">
                            {tierIndex === 0 ? (
                              <>
                                Tháng {Number(group.billingMonth.slice(5, 7))}/
                                {group.billingMonth.slice(0, 4)}
                                <span className="block text-slate-500">
                                  {group.className}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400">
                                Mức phí khác
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top text-slate-600">
                            <span className="font-medium whitespace-nowrap sm:hidden">
                              {tier.lessonCount} buổi
                            </span>
                            <div className="hidden flex-wrap gap-1.5 sm:flex">
                              {lessonDateLabels(tier.lessonDates).map(
                                (date) => (
                                  <span
                                    key={date}
                                    className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 tabular-nums"
                                  >
                                    {date}
                                  </span>
                                ),
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right align-top tabular-nums">
                            {money(tier.feePerSession)} × {tier.lessonCount}
                          </td>
                          <td className="px-3 py-3 text-right align-top tabular-nums">
                            <span className="font-semibold">
                              {money(tier.originalAmount)}
                            </span>
                            {tier.previouslyPaid > 0 && (
                              <span className="block text-xs text-slate-500">
                                Đã trả {money(tier.previouslyPaid)}
                                <br />
                                Còn {money(tier.remainingAmount)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span>Tổng học phí gốc</span>
                      <strong>{money(qr.summary.originalAmount)}</strong>
                    </div>
                    <div className="mt-2 flex justify-between text-slate-600">
                      <span>Đã thanh toán</span>
                      <strong>{money(qr.summary.previouslyPaid)}</strong>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg text-teal-700">
                      <strong>Cần thanh toán</strong>
                      <strong>{money(qr.summary.remainingAmount)}</strong>
                    </div>
                  </div>
                  <div className="rounded-xl bg-teal-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">
                      Thông tin học phí
                    </p>
                    <p className="mt-1 break-words">{qr.fullDescription}</p>
                    <div className="mt-4 border-t border-teal-200 pt-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Các buổi đã học
                      </p>
                      <div className="mt-3 space-y-3">
                        {qr.groups.map((group) => (
                          <div
                            key={`${group.billingMonth}-${group.classId}`}
                            className="grid gap-2 sm:grid-cols-[minmax(130px,auto)_1fr] sm:items-start"
                          >
                            <p className="text-xs font-semibold text-slate-700">
                              Tháng {Number(group.billingMonth.slice(5, 7))}/
                              {group.billingMonth.slice(0, 4)} ·{' '}
                              {group.className}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {lessonDateLabels(group.lessonDates).map(
                                (date) => (
                                  <span
                                    key={date}
                                    className="rounded-md border border-teal-200 bg-white px-2 py-1 text-xs font-semibold text-teal-700 tabular-nums"
                                  >
                                    {date}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-dashed border-teal-400 p-4 text-center">
                  <p className="text-xs font-bold tracking-wide text-teal-700 uppercase">
                    Mã thanh toán
                  </p>
                  <Image
                    ref={receiptQrRef}
                    src={qrImageUrl}
                    alt="Mã VietQR thanh toán"
                    width={240}
                    height={240}
                    unoptimized
                    className="mx-auto mt-1 h-auto w-full max-w-52 object-contain"
                  />
                  <p className="mt-2 text-sm font-bold break-all text-rose-600">
                    {qr.bankCode} · {qr.bankAccountNumber}
                  </p>
                  {qr.bankAccountName && (
                    <p className="mt-0.5 text-xs font-semibold text-slate-600 uppercase">
                      {qr.bankAccountName}
                    </p>
                  )}
                  <p className="mt-2 text-xs break-words text-slate-500">
                    Nội dung: {qr.description}
                  </p>
                </div>
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
