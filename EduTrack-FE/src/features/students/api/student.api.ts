import { apiClient } from '@/lib/api/api-client';
export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  parentName: string | null;
  parentPhone: string | null;
  notes: string | null;
  isActive: boolean;
};
export type StudentInput = {
  fullName: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
};
export type StudentPage = { items: Student[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
export async function getStudents(search = '') {
  return (await getStudentsPage({ search, pageSize: 100 })).items;
}
export async function getStudentsPage(params: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) {
  return (
    await apiClient.get<StudentPage>('/students', {
      params,
    })
  ).data;
}
export async function createStudent(input: StudentInput) {
  return (await apiClient.post<Student>('/students', input)).data;
}
export async function updateStudent(
  id: string,
  input: Partial<StudentInput> & { isActive?: boolean },
) {
  return (await apiClient.patch<Student>(`/students/${id}`, input)).data;
}
