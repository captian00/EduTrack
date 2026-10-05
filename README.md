# EduTrack

Ứng dụng quản lý học sinh, lớp học, điểm danh, học phí và thanh toán dành cho giáo viên/gia sư.

## Cấu trúc

- `EduTrack-FE`: Next.js App Router, React, TypeScript và Tailwind CSS.
- `EduTrack-BE`: NestJS, Prisma, PostgreSQL/Supabase và Supabase Auth.
- `EduTrack-AI-Coding-Spec.md`: nguồn yêu cầu kỹ thuật và nghiệp vụ chính thức.

## Chạy local

Yêu cầu Node.js LTS và Corepack.

```bash
cd EduTrack-BE
cp .env.example .env
corepack pnpm install
corepack pnpm prisma:generate
corepack pnpm start:dev
```

```bash
cd EduTrack-FE
cp .env.example .env.local
corepack pnpm install
corepack pnpm dev
```

Frontend chạy tại `http://localhost:3000`, Backend tại `http://localhost:3001`. Swagger có tại `http://localhost:3001/docs` trong môi trường không phải production.
