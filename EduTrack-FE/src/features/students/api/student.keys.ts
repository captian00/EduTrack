export const studentKeys = {
  all: ['students'] as const,
  list: (search: string) => ['students', 'list', search] as const,
};
