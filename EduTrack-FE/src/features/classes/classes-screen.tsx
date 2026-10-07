'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ActiveFilterChips,
  FilterPanel,
  Pagination,
  type PageMeta,
} from '@/components/shared/list-controls';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useListParams } from '@/lib/hooks/use-list-params';

import { getStudents } from '@/features/students/api/student.api';
import { apiClient } from '@/lib/api/api-client';

type ClassItem = {
  id: string;
  name: string;
  defaultFee: number;
  scheduleNote: string | null;
  isActive: boolean;
  _count: { enrollments: number };
};
type ClassDetail = ClassItem & {
  enrollments: {
    id: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    feePerSession: number;
    student: { fullName: string; studentCode: string };
  }[];
};
const money = new Intl.NumberFormat('vi-VN');

export function ClassesScreen() {
  const params = useListParams();
  const [search, setSearch] = useState(() => params.get('search'));
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const activeParam = params.get('isActive');
  const [activeDraft, setActiveDraft] = useState(activeParam);
  useEffect(() => {
    if (debouncedSearch !== params.get('search'))
      params.update({ search: debouncedSearch });
  }, [debouncedSearch, params]);
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<
    { kind: 'class'; item: ClassItem } | { kind: 'enrollment'; id: string }
  >();
  const [selectedId, setSelectedId] = useState<string>();
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [studentId, setStudentId] = useState('');
  const classParams = {
    search: params.get('search') || undefined,
    isActive: activeParam || undefined,
    page: params.page,
    pageSize: params.pageSize,
  };
  const classes = useQuery({
    queryKey: ['classes', classParams],
    queryFn: async () =>
      (
        await apiClient.get<{ items: ClassItem[]; meta: PageMeta }>(
          '/classes',
          {
            params: classParams,
          },
        )
      ).data,
    placeholderData: (old) => old,
  });
  const detail = useQuery({
    queryKey: ['classes', selectedId],
    queryFn: async () =>
      (await apiClient.get<ClassDetail>(`/classes/${selectedId}`)).data,
    enabled: Boolean(selectedId),
  });
  const students = useQuery({
    queryKey: ['students', 'active'],
    queryFn: () => getStudents(),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['classes'] });
  };
  const create = useMutation({
    mutationFn: () =>
      editingId
        ? apiClient.patch(`/classes/${editingId}`, {
            name,
            defaultFee: Number(fee),
          })
        : apiClient.post('/classes', { name, defaultFee: Number(fee) }),
    onSuccess: async () => {
      toast.success(editingId ? 'Đã cập nhật lớp' : 'Đã tạo lớp');
      setName('');
      setFee('');
      setShowForm(false);
      setEditingId(undefined);
      await refresh();
    },
  });
  const enroll = useMutation({
    mutationFn: () =>
      apiClient.post(`/classes/${selectedId}/enrollments`, {
        studentId,
        startDate: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: async () => {
      toast.success('Đã thêm học sinh vào lớp');
      setStudentId('');
      await refresh();
    },
  });
  const endEnrollment = async (id: string) => {
    await apiClient.patch(`/classes/${selectedId}/enrollments/${id}/end`, {
      endDate: new Date().toISOString().slice(0, 10),
    });
    toast.success('Đã kết thúc enrollment');
    await refresh();
  };
  const toggleClass = async (item: ClassItem) => {
    await apiClient.patch(`/classes/${item.id}`, { isActive: !item.isActive });
    await refresh();
  };
  const editClass = async (item: ClassItem) => {
    setName(item.name);
    setFee(String(item.defaultFee));
    setEditingId(item.id);
    setShowForm(true);
  };

  if (classes.isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Giảng dạy"
        title="Lớp học"
        description="Quản lý lớp, mức phí và danh sách học sinh."
        actions={
          <Button
            onClick={() => {
              setEditingId(undefined);
              setName('');
              setFee('');
              setShowForm(!showForm);
            }}
          >
            Thêm lớp
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên lớp…"
          className="mt-0 flex-1"
        />
        <FilterPanel
          activeCount={activeParam ? 1 : 0}
          onOpenChange={(open) => open && setActiveDraft(activeParam)}
          onReset={() => setActiveDraft('')}
          onApply={() => params.update({ isActive: activeDraft })}
        >
          <label className="text-sm font-semibold">
            Trạng thái
            <Select
              value={activeDraft}
              onValueChange={(value) =>
                setActiveDraft(value === 'ALL' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Đã ngừng</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </FilterPanel>
      </Card>
      <ActiveFilterChips
        filters={
          activeParam
            ? [
                {
                  key: 'isActive',
                  label: activeParam === 'true' ? 'Hoạt động' : 'Đã ngừng',
                },
              ]
            : []
        }
        onRemove={() => params.update({ isActive: undefined })}
        onClear={() => params.clear()}
      />
      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2 sm:items-end"
        >
          <label className="text-sm font-medium">
            Tên lớp
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="text-sm font-medium">
            Học phí/buổi
            <CurrencyInput
              value={fee}
              onValueChange={setFee}
              required
              className="mt-2"
            />
          </label>
          <div className="flex border-t border-slate-100 pt-4 sm:col-span-2 sm:justify-end">
            <Button className="w-full sm:w-auto" loading={create.isPending}>
              Lưu lớp học
            </Button>
          </div>
        </form>
      )}
      {selectedId && detail.data && (
        <section className="rounded-2xl border bg-white p-5">
          <div className="flex justify-between gap-3">
            <div>
              <h2 className="font-semibold">Học sinh · {detail.data.name}</h2>
              <p className="text-sm text-slate-500">
                Enrollment cũ được giữ lại để bảo toàn lịch sử.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedId(undefined)}
            >
              Đóng
            </Button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              enroll.mutate();
            }}
            className="mt-4 flex flex-wrap gap-3"
          >
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-0 flex-1">
                <SelectValue placeholder="Chọn học sinh" />
              </SelectTrigger>
              <SelectContent>
                {students.data
                  ?.filter((item) => item.isActive)
                  .map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.studentCode} — {student.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button disabled={!studentId} loading={enroll.isPending}>
              Thêm vào lớp
            </Button>
          </form>
          <div className="mt-4 divide-y">
            {detail.data.enrollments.map((value) => (
              <div
                key={value.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {value.student.studentCode} — {value.student.fullName}
                  </p>
                  <p className="text-slate-500">
                    {money.format(value.feePerSession)} ₫ · từ{' '}
                    {new Date(value.startDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                {value.isActive && (
                  <Button
                    size="sm"
                    variant="dangerOutline"
                    onClick={() =>
                      setConfirmAction({ kind: 'enrollment', id: value.id })
                    }
                    className="text-rose-600"
                  >
                    Kết thúc
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.data?.items.length === 0 ? (
          <p>Chưa có lớp học.</p>
        ) : (
          classes.data?.items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${
                item.isActive
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 shadow-emerald-200/80 hover:border-emerald-400'
                  : 'border-rose-300 bg-gradient-to-br from-rose-100 via-orange-50 to-slate-100 shadow-rose-200/70 hover:border-rose-400'
              }`}
            >
              <div className="flex justify-between gap-2">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <Badge variant={item.isActive ? 'success' : 'danger'}>
                  {item.isActive ? 'Hoạt động' : 'Đã ngừng'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {item.scheduleNote || 'Chưa có ghi chú lịch học'}
              </p>
              <p
                className={`mt-4 font-semibold tabular-nums ${item.isActive ? 'text-emerald-900' : 'text-rose-900'}`}
              >
                {money.format(item.defaultFee)} ₫/buổi
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {item._count.enrollments} enrollment
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedId(item.id)}
                >
                  Quản lý học sinh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editClass(item)}
                >
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant={item.isActive ? 'dangerOutline' : 'success'}
                  onClick={() => setConfirmAction({ kind: 'class', item })}
                >
                  {item.isActive ? 'Ngừng lớp' : 'Kích hoạt'}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
      {classes.data && (
        <Pagination
          meta={classes.data.meta}
          onPageChange={(page) => params.update({ page }, false)}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(undefined)}
        title={
          confirmAction?.kind === 'enrollment'
            ? 'Kết thúc enrollment?'
            : 'Đổi trạng thái lớp?'
        }
        description={
          confirmAction?.kind === 'enrollment'
            ? 'Học sinh sẽ được kết thúc enrollment hôm nay; lịch sử học tập vẫn được giữ lại.'
            : 'Trạng thái lớp sẽ được cập nhật và không làm mất dữ liệu lịch sử.'
        }
        onConfirm={() => {
          if (!confirmAction) return;
          const task =
            confirmAction.kind === 'enrollment'
              ? endEnrollment(confirmAction.id)
              : toggleClass(confirmAction.item);
          void task.finally(() => setConfirmAction(undefined));
        }}
      />
    </div>
  );
}
