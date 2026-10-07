import { z } from 'zod';
export const studentSchema = z.object({
  fullName: z.string().min(2, 'Nhập ít nhất 2 ký tự').max(120),
  parentName: z.string().max(120).optional(),
  parentPhone: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
});
export type StudentForm = z.infer<typeof studentSchema>;
