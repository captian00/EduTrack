'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  ActiveFilterChips,
  FilterPanel,
  Pagination,
  tableIndex,
} from '@/components/shared/list-controls';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageSkeleton } from '@/components/shared/loading';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useListParams } from '@/lib/hooks/use-list-params';
import {
  createStudent,
  getStudentsPage,
  updateStudent,
  type Student,
} from '../api/student.api';
import { studentKeys } from '../api/student.keys';
import { studentSchema, type StudentForm } from '../schemas/student.schema';
import { StudentNotesSheet } from './student-notes-sheet';

const emptyForm = { fullName: '', parentName: '', parentPhone: '', notes: '' };
export function StudentsScreen() {
  const params = useListParams();
  const [search, setSearch] = useState(() => params.get('search'));
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const activeParam = params.get('isActive');
  const [activeDraft, setActiveDraft] = useState(activeParam);
  const isActive =
    activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
  const [editing, setEditing] = useState<Student | null>();
  const [statusTarget, setStatusTarget] = useState<Student>();
  const [detailStudent, setDetailStudent] = useState<Student>();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (debouncedSearch !== params.get('search'))
      params.update({ search: debouncedSearch });
  }, [debouncedSearch, params]);
  const query = useQuery({
    queryKey: [
      ...studentKeys.list(params.get('search')),
      isActive,
      params.page,
      params.pageSize,
    ],
    queryFn: () =>
      getStudentsPage({
        search: params.get('search') || undefined,
        isActive,
        page: params.page,
        pageSize: params.pageSize,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyForm,
  });
  const save = useMutation({
    mutationFn: (input: StudentForm) =>
      editing ? updateStudent(editing.id, input) : createStudent(input),
    onSuccess: async () => {
      toast.success(editing ? 'Đã cập nhật học sinh' : 'Đã thêm học sinh');
      setEditing(undefined);
      form.reset(emptyForm);
      await queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
    onError: () => toast.error('Không thể lưu học sinh. Vui lòng thử lại.'),
  });
  const toggle = useMutation({
    mutationFn: (student: Student) =>
      updateStudent(student.id, { isActive: !student.isActive }),
    onSuccess: async () => {
      toast.success('Đã cập nhật trạng thái');
      setStatusTarget(undefined);
      await queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
    onError: () => toast.error('Không thể cập nhật trạng thái.'),
  });
  const open = (student: Student | null) => {
    setEditing(student);
    form.reset(
      student
        ? {
            fullName: student.fullName,
            parentName: student.parentName ?? '',
            parentPhone: student.parentPhone ?? '',
            notes: student.notes ?? '',
          }
        : emptyForm,
    );
  };
  if (query.isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Hồ sơ"
        title="Học sinh"
        description="Quản lý hồ sơ, thông tin phụ huynh và trạng thái học tập."
        actions={
          <Button onClick={() => open(null)}>
            <Plus aria-hidden="true" size={18} />
            Thêm học sinh
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="flex-1">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15">
            <Search aria-hidden="true" size={18} className="text-slate-400" />
            <span className="sr-only">Tìm kiếm học sinh</span>
            <Input
              name="student-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, phụ huynh, số điện thoại…"
              autoComplete="off"
              aria-busy={query.isFetching}
              className="mt-0 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
          </label>
        </div>
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
                <SelectItem value="true">Đang học</SelectItem>
                <SelectItem value="false">Ngừng học</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </FilterPanel>
      </Card>
      <ActiveFilterChips
        filters={
          activeParam
            ? [{ key: 'isActive', label: isActive ? 'Đang học' : 'Ngừng học' }]
            : []
        }
        onRemove={() => params.update({ isActive: undefined })}
        onClear={() => params.clear()}
      />
      {query.isError ? (
        <Card className="p-8 text-center">
          <p className="font-semibold text-rose-700">
            Không tải được danh sách học sinh.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => query.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : !query.data?.items.length ? (
        <Card>
          <EmptyState
            title="Không có kết quả"
            description="Thử thay đổi bộ lọc hoặc tạo học sinh mới."
            action={
              <Button onClick={() => open(null)}>
                <Plus aria-hidden="true" size={18} />
                Thêm học sinh
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="surface-table hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Phụ huynh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((s, index) => (
                  <TableRow
                    key={s.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <TableCell className="text-slate-500 tabular-nums">
                      {tableIndex(query.data.meta, index)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailStudent(s)}
                        className="h-auto min-h-0 justify-start p-0 text-base font-semibold text-slate-900 hover:bg-transparent hover:text-indigo-700"
                      >
                        {s.fullName}
                      </Button>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {s.studentCode}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{s.parentName || '—'}</p>
                      <p className="text-xs text-slate-500">
                        {s.parentPhone || 'Chưa có số điện thoại'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'neutral'}>
                        {s.isActive ? 'Đang học' : 'Ngừng học'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDetailStudent(s)}
                        >
                          Ghi chú
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => open(s)}
                        >
                          <Pencil aria-hidden="true" size={15} />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant={s.isActive ? 'dangerOutline' : 'success'}
                          onClick={() => setStatusTarget(s)}
                        >
                          {s.isActive ? 'Ngừng học' : 'Kích hoạt'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {query.data.items.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UserRound aria-hidden="true" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate font-semibold">{s.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {s.studentCode}
                        </p>
                      </div>
                      <Badge variant={s.isActive ? 'success' : 'neutral'}>
                        {s.isActive ? 'Đang học' : 'Ngừng học'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {s.parentName || 'Chưa có phụ huynh'} ·{' '}
                      {s.parentPhone || 'Chưa có SĐT'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDetailStudent(s)}
                      >
                        Ghi chú
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => open(s)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant={s.isActive ? 'dangerOutline' : 'success'}
                        onClick={() => setStatusTarget(s)}
                      >
                        {s.isActive ? 'Ngừng học' : 'Kích hoạt'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination
            meta={query.data.meta}
            onPageChange={(page) => params.update({ page }, false)}
          />
        </>
      )}
      <Dialog
        open={editing !== undefined}
        onOpenChange={(v) => !v && setEditing(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Cập nhật ${editing.fullName}` : 'Thêm học sinh'}
            </DialogTitle>
            <DialogDescription>
              Thông tin dùng xuyên suốt khi xếp lớp, điểm danh và thu học phí.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className="space-y-4"
          >
            <Field
              label="Họ và tên"
              error={form.formState.errors.fullName?.message}
            >
              <Input {...form.register('fullName')} autoComplete="name" />
            </Field>
            <Field label="Tên phụ huynh">
              <Input {...form.register('parentName')} autoComplete="name" />
            </Field>
            <Field label="Số điện thoại">
              <Input
                {...form.register('parentPhone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <Field label="Ghi chú">
              <Textarea {...form.register('notes')} rows={3} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(undefined)}
              >
                Hủy
              </Button>
              <Button loading={save.isPending}>Lưu học sinh</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(v) => !v && setStatusTarget(undefined)}
        title={
          statusTarget?.isActive ? 'Ngừng học sinh?' : 'Kích hoạt học sinh?'
        }
        description={
          statusTarget?.isActive
            ? 'Học sinh sẽ không xuất hiện trong danh sách hoạt động. Lịch sử vẫn được giữ nguyên.'
            : 'Học sinh sẽ có thể được xếp vào lớp trở lại.'
        }
        confirmLabel={statusTarget?.isActive ? 'Ngừng học' : 'Kích hoạt'}
        pending={toggle.isPending}
        onConfirm={() => statusTarget && toggle.mutate(statusTarget)}
      />
      <StudentNotesSheet
        student={detailStudent}
        onOpenChange={(open) => !open && setDetailStudent(undefined)}
      />
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
      {error && (
        <span
          role="alert"
          className="mt-1.5 block text-xs font-medium text-rose-600"
        >
          {error}
        </span>
      )}
    </label>
  );
}
