'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api-client';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/loading';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { countAttendanceStatuses } from './attendance-summary';
import { studentNoteKeys } from '@/features/students/api/student-note.api';
type Status = 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'MAKEUP';
const attendanceStatuses: {
  value: Status;
  label: string;
  activeClass: string;
}[] = [
  {
    value: 'PRESENT',
    label: 'Có mặt',
    activeClass:
      'border-emerald-500 bg-emerald-50 text-emerald-700 ring-emerald-500/20',
  },
  {
    value: 'ABSENT_EXCUSED',
    label: 'Vắng có phép',
    activeClass:
      'border-amber-500 bg-amber-50 text-amber-700 ring-amber-500/20',
  },
  {
    value: 'ABSENT_UNEXCUSED',
    label: 'Vắng không phép',
    activeClass: 'border-rose-500 bg-rose-50 text-rose-700 ring-rose-500/20',
  },
  {
    value: 'MAKEUP',
    label: 'Học bù',
    activeClass:
      'border-indigo-500 bg-indigo-50 text-indigo-700 ring-indigo-500/20',
  },
];
const attendanceCardClass: Record<Status, string> = {
  PRESENT: 'border-emerald-200 bg-emerald-50/60',
  ABSENT_EXCUSED: 'border-amber-200 bg-amber-50/60',
  ABSENT_UNEXCUSED: 'border-rose-200 bg-rose-50/60',
  MAKEUP: 'border-indigo-200 bg-indigo-50/60',
};
type Row = {
  student: { id: string; fullName: string; studentCode: string };
  feePerSession: number;
  attendance: {
    status: Status;
    note: string | null;
    makeupForAttendanceId: string | null;
  } | null;
  makeupCandidates: { id: string; lesson: { lessonDate: string } }[];
};
type Roster = {
  lesson: { id: string; lessonDate: string; class: { name: string } };
  items: Row[];
};
type Draft = Record<
  string,
  { status: Status; note: string; makeupForAttendanceId?: string }
>;
const initialDraft = (roster: Roster): Draft =>
  Object.fromEntries(
    roster.items.map((row) => [
      row.student.id,
      {
        status: row.attendance?.status ?? 'PRESENT',
        note: row.attendance?.note ?? '',
        makeupForAttendanceId:
          row.attendance?.makeupForAttendanceId ?? undefined,
      },
    ]),
  );
export function AttendanceScreen() {
  const id = useSearchParams().get('lessonId');
  const query = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () =>
      (await apiClient.get<Roster>(`/lessons/${id}/attendance`)).data,
    enabled: Boolean(id),
  });
  if (!id)
    return (
      <div className="mx-auto max-w-3xl py-10 text-center">
        <h1 className="text-2xl font-bold">Chọn buổi học để điểm danh</h1>
        <p className="mt-4 text-slate-500">
          Hãy chọn một buổi học từ trang{' '}
          <Link href="/lessons" className="font-semibold text-indigo-700">
            Buổi học
          </Link>
          .
        </p>
      </div>
    );
  if (query.isPending) return <PageSkeleton />;
  if (query.isError || !query.data)
    return <p className="text-red-600">Không tải được danh sách điểm danh.</p>;
  return (
    <AttendanceForm
      key={`${id}-${query.data.items.length}`}
      lessonId={id}
      roster={query.data}
    />
  );
}
function AttendanceForm({
  lessonId,
  roster,
}: Readonly<{ lessonId: string; roster: Roster }>) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(roster));
  const client = useQueryClient();
  const counts = useMemo(
    () => countAttendanceStatuses(Object.values(draft)),
    [draft],
  );
  const save = useMutation({
    mutationFn: () =>
      apiClient.put(`/lessons/${lessonId}/attendance`, {
        items: Object.entries(draft).map(([studentId, value]) => ({
          studentId,
          ...value,
          makeupForAttendanceId:
            value.status === 'MAKEUP' ? value.makeupForAttendanceId : undefined,
        })),
      }),
    onSuccess: async () => {
      toast.success('Đã lưu điểm danh và hoàn tất buổi học');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['attendance', lessonId] }),
        client.invalidateQueries({ queryKey: studentNoteKeys.all }),
      ]);
    },
    onError: () => toast.error('Không thể lưu điểm danh'),
  });
  const update = (studentId: string, patch: Partial<Draft[string]>) =>
    setDraft((value) => ({
      ...value,
      [studentId]: { ...value[studentId], ...patch },
    }));
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="Điểm danh"
        title={roster.lesson.class.name}
        description={`Buổi học ngày ${formatDate(roster.lesson.lessonDate)}`}
      />
      <div className="sticky top-20 z-20 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur lg:top-4">
        <div className="col-span-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <div className="rounded-xl bg-slate-100 p-2 text-center">
            <p className="text-xs text-slate-500">Tổng số</p>
            <p className="font-extrabold tabular-nums">{roster.items.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-center text-emerald-700">
            <p className="text-xs">Có mặt</p>
            <p className="font-extrabold tabular-nums">{counts.PRESENT}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2 text-center text-amber-700">
            <p className="text-xs">Có phép</p>
            <p className="font-extrabold tabular-nums">
              {counts.ABSENT_EXCUSED}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-2 text-center text-rose-700">
            <p className="text-xs">Không phép</p>
            <p className="font-extrabold tabular-nums">
              {counts.ABSENT_UNEXCUSED}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-2 text-center text-indigo-700">
            <p className="text-xs">Học bù</p>
            <p className="font-extrabold tabular-nums">{counts.MAKEUP}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            setDraft(
              Object.fromEntries(
                roster.items.map((row) => [
                  row.student.id,
                  { status: 'PRESENT', note: '' },
                ]),
              ),
            )
          }
        >
          Đánh dấu tất cả có mặt
        </Button>
        <Button
          className="w-full sm:w-auto"
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Lưu điểm danh
        </Button>
      </div>
      <div className="space-y-3">
        {roster.items.map((row) => (
          <Card
            key={row.student.id}
            className={`rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] ${attendanceCardClass[draft[row.student.id]?.status ?? 'PRESENT']}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">
                  {row.student.fullName}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {row.student.studentCode} ·{' '}
                  {formatCurrency(row.feePerSession)}
                </p>
              </div>
              <Select
                value={draft[row.student.id]?.status ?? 'PRESENT'}
                onValueChange={(value) =>
                  update(row.student.id, { status: value as Status })
                }
              >
                <SelectTrigger
                  aria-label={`Trạng thái điểm danh của ${row.student.fullName}`}
                  className="mt-0 hidden w-48 sm:flex"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Có mặt</SelectItem>
                  <SelectItem value="ABSENT_EXCUSED">Vắng có phép</SelectItem>
                  <SelectItem value="ABSENT_UNEXCUSED">
                    Vắng không phép
                  </SelectItem>
                  <SelectItem value="MAKEUP">Học bù</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <fieldset className="mt-4 sm:hidden">
              <legend className="sr-only">
                Trạng thái điểm danh của {row.student.fullName}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {attendanceStatuses.map((status) => {
                  const selected =
                    (draft[row.student.id]?.status ?? 'PRESENT') ===
                    status.value;
                  return (
                    <Button
                      key={status.value}
                      type="button"
                      variant="outline"
                      aria-pressed={selected}
                      onClick={() =>
                        update(row.student.id, { status: status.value })
                      }
                      className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-semibold transition-[background-color,color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${selected ? `${status.activeClass} ring-2` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {status.label}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
            {draft[row.student.id]?.status === 'MAKEUP' && (
              <>
                <Select
                  value={draft[row.student.id]?.makeupForAttendanceId}
                  onValueChange={(value) =>
                    update(row.student.id, { makeupForAttendanceId: value })
                  }
                >
                  <SelectTrigger
                    disabled={row.makeupCandidates.length === 0}
                    aria-label={`Chọn buổi vắng gốc cho ${row.student.fullName}`}
                  >
                    <SelectValue
                      placeholder={
                        row.makeupCandidates.length
                          ? 'Chọn buổi vắng gốc'
                          : 'Không có buổi vắng phù hợp'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {row.makeupCandidates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {formatDate(item.lesson.lessonDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {row.makeupCandidates.length === 0 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-700">
                    Học sinh chưa có buổi vắng đủ điều kiện để học bù.
                  </p>
                )}
              </>
            )}
            <Input
              value={draft[row.student.id]?.note ?? ''}
              onChange={(e) => update(row.student.id, { note: e.target.value })}
              placeholder="Ghi chú…"
              className="mt-3"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Ghi chú này sẽ xuất hiện trong lịch sử học sinh.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
