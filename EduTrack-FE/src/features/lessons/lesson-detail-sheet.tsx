'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/shared/date-range-picker';
import { LoadingSpinner } from '@/components/shared/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/api-client';
import { formatDate } from '@/lib/utils';
import {
  createStudentNote,
  studentNoteKeys,
} from '@/features/students/api/student-note.api';

type Roster = {
  lesson: {
    id: string;
    lessonDate: string;
    topic: string | null;
    status: string;
    class: { name: string };
  };
  items: {
    student: { id: string; studentCode: string; fullName: string };
    notes: { id: string; content: string }[];
  }[];
};
export function LessonDetailSheet({
  lessonId,
  onOpenChange,
}: {
  lessonId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const [studentId, setStudentId] = useState<string>();
  const [content, setContent] = useState('');
  const query = useQuery({
    queryKey: ['lessons', lessonId, 'students'],
    queryFn: async () =>
      (await apiClient.get<Roster>(`/lessons/${lessonId}/students`)).data,
    enabled: Boolean(lessonId),
  });
  const [noteDate, setNoteDate] = useState('');
  const create = useMutation({
    mutationFn: () =>
      createStudentNote(studentId!, {
        content: content.trim(),
        noteDate: noteDate || query.data!.lesson.lessonDate.slice(0, 10),
        lessonId,
      }),
    onSuccess: async () => {
      setContent('');
      setStudentId(undefined);
      toast.success('Đã thêm ghi chú');
      await Promise.all([
        client.invalidateQueries({
          queryKey: ['lessons', lessonId, 'students'],
        }),
        client.invalidateQueries({ queryKey: studentNoteKeys.all }),
      ]);
    },
    onError: () => toast.error('Không thể thêm ghi chú.'),
  });
  const close = () => {
    setStudentId(undefined);
    setContent('');
    setNoteDate('');
    onOpenChange(false);
  };
  return (
    <Sheet open={Boolean(lessonId)} onOpenChange={(open) => !open && close()}>
      <SheetContent>
        <header className="border-b p-5 pr-16 sm:p-6">
          <p className="text-xs font-bold tracking-[0.18em] text-indigo-600 uppercase">
            Chi tiết buổi học
          </p>
          <SheetTitle className="mt-1 text-2xl font-extrabold">
            {query.data?.lesson.class.name ?? 'Chi tiết buổi học'}
          </SheetTitle>
          {query.data ? (
            <SheetDescription className="mt-1">
              {`${formatDate(query.data.lesson.lessonDate)} · ${query.data.lesson.topic || 'Không có chủ đề'}`}
            </SheetDescription>
          ) : null}
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {query.data ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bold">{query.data.items.length} học sinh</p>
                {query.data.lesson.status !== 'CANCELLED' ? (
                  <Button asChild>
                    <Link href={`/attendance?lessonId=${lessonId}`}>
                      Mở điểm danh
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="danger">Đã hủy</Badge>
                )}
              </div>
              <div className="space-y-3">
                {query.data.items.map(({ student, notes }) => (
                  <article
                    key={student.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold">
                          {student.fullName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {student.studentCode} · {notes.length} ghi chú trong
                          buổi
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={
                          studentId === student.id ? 'secondary' : 'outline'
                        }
                        onClick={() => {
                          setStudentId(
                            studentId === student.id ? undefined : student.id,
                          );
                          setContent('');
                          setNoteDate(
                            query.data!.lesson.lessonDate.slice(0, 10),
                          );
                        }}
                      >
                        Thêm ghi chú
                      </Button>
                    </div>
                    {notes.length ? (
                      <div className="mt-3 space-y-2">
                        {notes.map((note) => (
                          <p
                            key={note.id}
                            className="rounded-xl bg-slate-50 p-3 text-sm break-words whitespace-pre-wrap"
                          >
                            {note.content}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {studentId === student.id ? (
                      <div className="mt-4 border-t pt-4">
                        <label className="text-sm font-semibold">
                          Ngày
                          <DatePicker value={noteDate} onChange={setNoteDate} />
                        </label>
                        <label className="mt-3 block text-sm font-semibold">
                          Nội dung
                          <Textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={2000}
                            placeholder="Nhập nội dung ghi chú…"
                          />
                        </label>
                        <div className="mt-3 flex justify-end">
                          <Button
                            loading={create.isPending}
                            disabled={!content.trim()}
                            onClick={() => create.mutate()}
                          >
                            Lưu ghi chú
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <LoadingSpinner label="Đang tải danh sách học sinh" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
