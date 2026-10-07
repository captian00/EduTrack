'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import {
  ActiveFilterChips,
  FilterPanel,
  Pagination,
  tableIndex,
  type PageMeta,
} from '@/components/shared/list-controls';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/api-client';
import { useListParams } from '@/lib/hooks/use-list-params';
import { Card } from '@/components/ui/card';
import {
  DatePicker,
  DateRangePicker,
} from '@/components/shared/date-range-picker';
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
import { LessonDetailSheet } from './lesson-detail-sheet';
import { PageSkeleton } from '@/components/shared/loading';
type ClassItem = { id: string; name: string };
type Lesson = {
  id: string;
  lessonDate: string;
  startTime: string | null;
  endTime: string | null;
  topic: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  class: ClassItem;
};
export function LessonsScreen() {
  const params = useListParams();
  const client = useQueryClient();
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [cancelId, setCancelId] = useState<string>();
  const [detailId, setDetailId] = useState<string>();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [topic, setTopic] = useState('');
  const filterClassId = params.get('classId');
  const rawStatus = params.get('status');
  const filterStatus = ['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(
    rawStatus,
  )
    ? rawStatus
    : '';
  const from = params.get('from');
  const to = params.get('to');
  const [filterDraft, setFilterDraft] = useState({
    classId: filterClassId,
    status: filterStatus,
    from,
    to,
  });
  const lessonParams = {
    classId: filterClassId || undefined,
    status: filterStatus || undefined,
    from: from || undefined,
    to: to || undefined,
    page: params.page,
    pageSize: params.pageSize,
  };
  const lessons = useQuery({
    queryKey: ['lessons', lessonParams],
    queryFn: async () =>
      (
        await apiClient.get<{ items: Lesson[]; meta: PageMeta }>('/lessons', {
          params: lessonParams,
        })
      ).data,
    placeholderData: (old) => old,
    enabled: !(from && to && from > to),
  });
  const classes = useQuery({
    queryKey: ['classes'],
    queryFn: async () =>
      (
        await apiClient.get<{ items: ClassItem[] }>('/classes', {
          params: { pageSize: 100, isActive: true },
        })
      ).data.items,
  });
  const create = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await apiClient.patch(`/lessons/${editingId}`, {
          topic: topic || undefined,
        });
      } else {
        await apiClient.post('/lessons', {
          classId,
          lessonDate: date,
          startTime: time || undefined,
          topic: topic || undefined,
        });
      }
    },
    onSuccess: async () => {
      toast.success(editingId ? 'Đã cập nhật buổi học' : 'Đã tạo buổi học');
      setShow(false);
      setTopic('');
      setEditingId(undefined);
      await client.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error: { response?: { data?: { code?: string } } }) =>
      toast.error(
        error.response?.data?.code === 'LESSON_ALREADY_EXISTS'
          ? 'Lớp đã có buổi học vào ngày và giờ này.'
          : 'Không thể lưu buổi học.',
      ),
  });
  const cancel = async (id: string) => {
    await apiClient.post(`/lessons/${id}/cancel`);
    toast.success('Đã hủy buổi học');
    await client.invalidateQueries({ queryKey: ['lessons'] });
  };
  const edit = async (lesson: Lesson) => {
    setEditingId(lesson.id);
    setTopic(lesson.topic ?? '');
    setShow(true);
  };
  if (lessons.isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Lịch học"
        title="Buổi học"
        description="Lập lịch và mở điểm danh theo từng lớp."
        actions={
          <Button
            onClick={() => {
              setEditingId(undefined);
              setTopic('');
              setShow(!show);
            }}
          >
            Tạo buổi học
          </Button>
        }
      />
      {show && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Lớp
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {classes.data?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-medium">
            Ngày
            <DatePicker value={date} onChange={setDate} />
          </label>
          <label className="text-sm font-medium">
            Giờ bắt đầu
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Chủ đề
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </label>
          <Button
            disabled={!editingId && !classId}
            loading={create.isPending}
            className="sm:col-span-2"
          >
            Lưu
          </Button>
        </form>
      )}
      <FilterPanel
        activeCount={
          [filterClassId, filterStatus, from, to].filter(Boolean).length
        }
        onOpenChange={(open) =>
          open &&
          setFilterDraft({
            classId: filterClassId,
            status: filterStatus,
            from,
            to,
          })
        }
        onReset={() =>
          setFilterDraft({ classId: '', status: '', from: '', to: '' })
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
            Lớp
            <Select
              value={filterDraft.classId}
              onValueChange={(value) =>
                setFilterDraft((old) => ({
                  ...old,
                  classId: value === 'ALL' ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {classes.data?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
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
                <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn tất</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="sm:col-span-2">
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
          { key: 'classId', label: filterClassId ? 'Theo lớp' : '' },
          {
            key: 'status',
            label:
              filterStatus === 'SCHEDULED'
                ? 'Đã lên lịch'
                : filterStatus === 'COMPLETED'
                  ? 'Đã hoàn tất'
                  : filterStatus === 'CANCELLED'
                    ? 'Đã hủy'
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
              <TableHead>Lớp</TableHead>
              <TableHead>Chủ đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.data?.items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-slate-500 tabular-nums">
                  {tableIndex(lessons.data!.meta, index)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatDate(item.lessonDate)}</p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {item.startTime
                      ? `${formatTime(item.startTime)}${item.endTime ? ` – ${formatTime(item.endTime)}` : ''}`
                      : 'Chưa đặt giờ'}
                  </p>
                </TableCell>
                <TableCell className="font-medium">{item.class.name}</TableCell>
                <TableCell>{item.topic || '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === 'COMPLETED'
                        ? 'success'
                        : item.status === 'CANCELLED'
                          ? 'danger'
                          : 'info'
                    }
                  >
                    {item.status === 'COMPLETED'
                      ? 'Đã hoàn tất'
                      : item.status === 'CANCELLED'
                        ? 'Đã hủy'
                        : 'Đã lên lịch'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDetailId(item.id)}
                    >
                      Chi tiết
                    </Button>
                    {item.status !== 'CANCELLED' && (
                      <Button asChild size="sm">
                        <Link href={`/attendance?lessonId=${item.id}`}>
                          Điểm danh
                        </Link>
                      </Button>
                    )}
                    {item.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => edit(item)}
                      >
                        Sửa
                      </Button>
                    )}
                    {item.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="dangerOutline"
                        onClick={() => setCancelId(item.id)}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {lessons.data?.items.length === 0 && (
          <p className="p-8 text-center text-slate-500">Chưa có buổi học.</p>
        )}
      </div>
      <div className="grid gap-3 md:hidden">
        {lessons.data?.items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{item.class.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(item.lessonDate)}
                </p>
                <p className="mt-1 text-xs text-slate-500 tabular-nums">
                  {item.startTime
                    ? `${formatTime(item.startTime)}${item.endTime ? ` – ${formatTime(item.endTime)}` : ''}`
                    : 'Chưa đặt giờ'}
                </p>
              </div>
              <Badge
                variant={
                  item.status === 'COMPLETED'
                    ? 'success'
                    : item.status === 'CANCELLED'
                      ? 'danger'
                      : 'info'
                }
              >
                {item.status === 'COMPLETED'
                  ? 'Đã hoàn tất'
                  : item.status === 'CANCELLED'
                    ? 'Đã hủy'
                    : 'Đã lên lịch'}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {item.topic || 'Chưa có chủ đề'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDetailId(item.id)}
              >
                Chi tiết
              </Button>
              {item.status !== 'CANCELLED' && (
                <Button asChild size="sm">
                  <Link href={`/attendance?lessonId=${item.id}`}>
                    Điểm danh
                  </Link>
                </Button>
              )}
              {item.status === 'SCHEDULED' && (
                <Button size="sm" variant="outline" onClick={() => edit(item)}>
                  Sửa
                </Button>
              )}
              {item.status === 'SCHEDULED' && (
                <Button
                  size="sm"
                  variant="dangerOutline"
                  onClick={() => setCancelId(item.id)}
                >
                  Hủy
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {lessons.data && (
        <Pagination
          meta={lessons.data.meta}
          onPageChange={(page) => params.update({ page }, false)}
        />
      )}
      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(undefined)}
        title="Hủy buổi học?"
        description="Buổi học đã hủy sẽ không thể điểm danh hoặc phát sinh học phí."
        confirmLabel="Hủy buổi học"
        onConfirm={() =>
          cancelId &&
          void cancel(cancelId).finally(() => setCancelId(undefined))
        }
      />
      <LessonDetailSheet
        lessonId={detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
      />
    </div>
  );
}
