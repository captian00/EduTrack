import { apiClient } from '@/lib/api/api-client';
export type StudentNote = { id: string; source: 'STUDENT_NOTE' | 'ATTENDANCE'; noteDate: string; content: string; createdAt: string; lesson?: { id: string; lessonDate: string; className: string }; editable: boolean; deletable: boolean };
export type NotePage = { items: StudentNote[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
export const studentNoteKeys = { all: ['student-notes'] as const, student: (id: string) => ['student-notes', id] as const };
export async function getStudentNotes(studentId: string, page = 1) { return (await apiClient.get<NotePage>(`/students/${studentId}/notes`, { params: { page, pageSize: 20 } })).data; }
export async function createStudentNote(studentId: string, input: { content: string; noteDate: string; lessonId?: string }) { return (await apiClient.post<StudentNote>(`/students/${studentId}/notes`, input)).data; }
export async function updateStudentNote(id: string, input: { content?: string; noteDate?: string }) { return (await apiClient.patch<StudentNote>(`/student-notes/${id}`, input)).data; }
export async function deleteStudentNote(id: string) { await apiClient.delete(`/student-notes/${id}`); }
