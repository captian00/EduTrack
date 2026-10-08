'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api-client';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PageSkeleton } from '@/components/shared/loading';
import { Input } from '@/components/ui/input';
type Settings = {
  displayName: string;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  billExcusedAbsence: boolean;
  billUnexcusedAbsence: boolean;
  transferDescriptionTemplate: string;
};
type SettingsResponse = Omit<
  Settings,
  'displayName' | 'bankCode' | 'bankAccountNumber' | 'bankAccountName'
> & {
  displayName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

export function toSettingsForm(data: SettingsResponse): Settings {
  return {
    displayName: data.displayName ?? '',
    bankCode: data.bankCode ?? '',
    bankAccountNumber: data.bankAccountNumber ?? '',
    bankAccountName: data.bankAccountName ?? '',
    billExcusedAbsence: data.billExcusedAbsence,
    billUnexcusedAbsence: data.billUnexcusedAbsence,
    transferDescriptionTemplate: data.transferDescriptionTemplate,
  };
}

function toSettingsPayload(value: Settings): Settings {
  return {
    displayName: value.displayName,
    bankCode: value.bankCode,
    bankAccountNumber: value.bankAccountNumber,
    bankAccountName: value.bankAccountName,
    billExcusedAbsence: value.billExcusedAbsence,
    billUnexcusedAbsence: value.billUnexcusedAbsence,
    transferDescriptionTemplate: value.transferDescriptionTemplate,
  };
}
export function SettingsScreen() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () =>
      (await apiClient.get<SettingsResponse>('/settings')).data,
  });
  const form = useForm<Settings>({
    defaultValues: {
      displayName: '',
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      billExcusedAbsence: false,
      billUnexcusedAbsence: true,
      transferDescriptionTemplate:
        '{STUDENT_NAME} học phí tháng {MMYYYY}, tổng số buổi học {LESSON_COUNT}, tổng tiền {TOTAL_AMOUNT}',
    },
  });
  const billExcusedAbsence = useWatch({
    control: form.control,
    name: 'billExcusedAbsence',
  });
  const billUnexcusedAbsence = useWatch({
    control: form.control,
    name: 'billUnexcusedAbsence',
  });
  useEffect(() => {
    if (query.data) form.reset(toSettingsForm(query.data));
  }, [query.data, form]);
  const save = useMutation({
    mutationFn: async (value: Settings) =>
      (await apiClient.put('/settings', toSettingsPayload(value))).data,
    onSuccess: async () => {
      toast.success('Đã lưu cài đặt');
      await client.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  if (query.isPending) return <PageSkeleton variant="form" />;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Cấu hình"
        title="Cài đặt"
        description="Thông tin giáo viên, ngân hàng và quy tắc học phí."
      />
      <form
        onSubmit={form.handleSubmit((value) => save.mutate(value))}
        className="grid gap-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7"
      >
        <div className="sm:col-span-2">
          <h2 className="font-bold text-slate-900">Thông tin giáo viên</h2>
          <p className="mt-1 text-sm text-slate-500">
            Thông tin hiển thị trong không gian quản lý.
          </p>
        </div>
        <Field label="Tên giáo viên">
          <Input {...form.register('displayName')} autoComplete="name" />
        </Field>
        <div className="hidden sm:block" />
        <div className="border-t border-slate-100 pt-5 sm:col-span-2">
          <h2 className="font-bold text-slate-900">Tài khoản ngân hàng</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dùng để tạo mã VietQR cho học sinh.
          </p>
        </div>
        <Field label="Mã ngân hàng (VD: VCB)">
          <Input {...form.register('bankCode')} autoComplete="off" />
        </Field>
        <Field label="Số tài khoản">
          <Input
            {...form.register('bankAccountNumber')}
            inputMode="numeric"
            autoComplete="off"
          />
        </Field>
        <Field label="Tên chủ tài khoản">
          <Input {...form.register('bankAccountName')} autoComplete="off" />
        </Field>
        <Field label="Mẫu nội dung chuyển khoản">
          <Input
            {...form.register('transferDescriptionTemplate')}
            autoComplete="off"
          />
          <span className="mt-1.5 block text-xs leading-5 text-slate-500">
            Dùng các biến: {'{STUDENT_NAME}'}, {'{MMYYYY}'}, {'{LESSON_COUNT}'},{' '}
            {'{TOTAL_AMOUNT}'}.
          </span>
        </Field>
        <div className="space-y-3 text-sm sm:col-span-2">
          <p className="font-bold text-slate-900">Quy tắc học phí</p>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 hover:bg-slate-50">
            <Checkbox
              checked={billExcusedAbsence}
              onCheckedChange={(checked) =>
                form.setValue('billExcusedAbsence', checked === true, {
                  shouldDirty: true,
                })
              }
            />
            Tính phí vắng có phép
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 hover:bg-slate-50">
            <Checkbox
              checked={billUnexcusedAbsence}
              onCheckedChange={(checked) =>
                form.setValue('billUnexcusedAbsence', checked === true, {
                  shouldDirty: true,
                })
              }
            />
            Tính phí vắng không phép
          </label>
        </div>
        <Button
          loading={save.isPending}
          className="sm:col-span-2 sm:justify-self-end"
        >
          Lưu cài đặt
        </Button>
      </form>
    </div>
  );
}
function Field({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
