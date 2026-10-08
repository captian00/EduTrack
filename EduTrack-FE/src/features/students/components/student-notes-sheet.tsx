'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/shared/date-range-picker';
import { Pagination } from '@/components/shared/list-controls';
import { LoadingSpinner } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import {
  createStudentNote,
  deleteStudentNote,
  getStudentNotes,
  studentNoteKeys,
  type StudentNote,
  updateStudentNote,
} from '../api/student-note.api';
import type { Student } from '../api/student.api';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(),
  );
export function StudentNotesSheet({
  student,
  onOpenChange,
}: {
  student?: Student;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState(today);
  const [editing, setEditing] = useState<StudentNote>();
  const [deleting, setDeleting] = useState<StudentNote>();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...studentNoteKeys.student(student?.id ?? ''), page],
    queryFn: () => getStudentNotes(student!.id, page),
    enabled: Boolean(student),
    placeholderData: (old) => old,
  });
  const refresh = () =>
    client.invalidateQueries({
      queryKey: studentNoteKeys.student(student!.id),
    });
  const create = useMutation({
    mutationFn: () =>
      createStudentNote(student!.id, { content: content.trim(), noteDate }),
    onSuccess: async () => {
      setContent('');
      toast.success('Đã thêm ghi chú');
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: () =>
      updateStudentNote(editing!.id, { content: content.trim(), noteDate }),
    onSuccess: async () => {
      setEditing(undefined);
      setContent('');
      toast.success('Đã cập nhật ghi chú');
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteStudentNote(deleting!.id),
    onSuccess: async () => {
      setDeleting(undefined);
      toast.success('Đã xóa ghi chú');
      await refresh();
    },
  });
  const groups = useMemo(
    () =>
      Object.entries(
        Object.groupBy(query.data?.items ?? [], (note) =>
          note.noteDate.slice(0, 7),
        ),
      ),
    [query.data?.items],
  );
  const close = () => {
    setEditing(undefined);
    setDeleting(undefined);
    setContent('');
    setPage(1);
    onOpenChange(false);
  };
  return (
    <Sheet open={Boolean(student)} onOpenChange={(open) => !open && close()}>
      <SheetContent>
        <header className="border-b border-slate-100 p-5 pr-16 sm:p-6">
          <p className="text-xs font-bold tracking-[0.18em] text-indigo-600 uppercase">
            Hồ sơ học sinh
          </p>
          <SheetTitle className="mt-1 text-2xl font-extrabold">
            {student?.fullName}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-500">
            {student?.studentCode} · Ghi chú được lưu tối đa 3 tháng
          </SheetDescription>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:overflow-hidden sm:p-6">
          <section className="shrink-0 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h3 className="font-bold">
              {editing ? 'Sửa ghi chú' : 'Thêm ghi chú'}
            </h3>
            <div className="mt-3 grid gap-3">
              <label className="text-sm font-semibold">
                Ngày
                <DatePicker value={noteDate} onChange={setNoteDate} />
              </label>
              <label className="text-sm font-semibold">
                Nội dung
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung ghi chú…"
                  maxLength={2000}
                />
              </label>
              <div className="flex justify-end gap-2">
                {editing ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(undefined);
                      setContent('');
                    }}
                  >
                    Hủy sửa
                  </Button>
                ) : null}
                <Button
                  loading={create.isPending || update.isPending}
                  disabled={!content.trim()}
                  onClick={() => (editing ? update.mutate() : create.mutate())}
                >
                  {editing ? 'Lưu thay đổi' : 'Thêm ghi chú'}
                </Button>
              </div>
            </div>
          </section>
          <section className="mt-6 min-h-0 sm:flex sm:flex-1 sm:flex-col">
            <h3 className="shrink-0 text-lg font-extrabold">Lịch sử ghi chú</h3>
            <div className="sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain sm:pr-2">
              {query.isPending ? (
                <LoadingSpinner label="Đang tải lịch sử ghi chú" />
              ) : groups.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Chưa có ghi chú trong 3 tháng gần đây.
                </p>
              ) : (
                <div className="mt-4 space-y-7">
                  {groups.map(([month, monthNotes]) => (
                    <section key={month}>
                      <h4 className="mb-3 text-sm font-extrabold tracking-wide text-indigo-700 uppercase">
                        {new Intl.DateTimeFormat('vi-VN', {
                          month: 'long',
                          year: 'numeric',
                          timeZone: 'UTC',
                        }).format(new Date(`${month}-01T00:00:00Z`))}
                      </h4>
                      <div className="space-y-5">
                        {Object.entries(
                          Object.groupBy(monthNotes!, (note) =>
                            note.noteDate.slice(0, 10),
                          ),
                        ).map(([date, notes]) => (
                          <div key={date}>
                            <div className="mb-2 flex items-center gap-2">
                              <CalendarDays
                                aria-hidden="true"
                                size={16}
                                className="text-indigo-600"
                              />
                              <h5 className="font-bold">{formatDate(date)}</h5>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                {notes!.length}
                              </span>
                            </div>
                            <div className="space-y-2 border-l-2 border-indigo-100 pl-4">
                              {notes!.map((note) => (
                                <article
                                  key={`${note.source}-${note.id}`}
                                  className="rounded-xl border bg-white p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <Badge
                                      variant={
                                        note.source === 'ATTENDANCE'
                                          ? 'info'
                                          : 'neutral'
                                      }
                                    >
                                      {note.source === 'ATTENDANCE'
                                        ? 'Điểm danh'
                                        : 'Ghi chú'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                                    {note.lesson ? (
                                      <span className="font-semibold text-slate-700">
                                        {note.lesson.className} ·{' '}
                                        {formatDate(note.lesson.lessonDate)}{' '}
                                        —{' '}
                                      </span>
                                    ) : null}
                                    {note.content}
                                  </p>
                                  {note.editable || note.deletable ? (
                                    <div className="mt-2 flex justify-end gap-1">
                                      {note.editable ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditing(note);
                                            setContent(note.content);
                                            setNoteDate(
                                              note.noteDate.slice(0, 10),
                                            );
                                          }}
                                        >
                                          <Pencil
                                            aria-hidden="true"
                                            size={14}
                                          />
                                          Sửa
                                        </Button>
                                      ) : null}
                                      {note.deletable ? (
                                        <Button
                                          size="sm"
                                          variant="dangerOutline"
                                          onClick={() => setDeleting(note)}
                                        >
                                          <Trash2
                                            aria-hidden="true"
                                            size={14}
                                          />
                                          Xóa
                                        </Button>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-slate-400">
                                      Chỉnh sửa tại màn Điểm danh
                                    </p>
                                  )}
                                </article>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {query.data && query.data.meta.totalPages > 1 ? (
                <Pagination meta={query.data.meta} onPageChange={setPage} />
              ) : null}
            </div>
          </section>
        </div>
        <ConfirmDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => !open && setDeleting(undefined)}
          title="Xóa ghi chú?"
          description="Ghi chú đã xóa không thể khôi phục."
          confirmLabel="Xóa ghi chú"
          pending={remove.isPending}
          onConfirm={() => remove.mutate()}
        />
      </SheetContent>
    </Sheet>
  );
}
