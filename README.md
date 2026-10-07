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

## Khởi tạo database

Sau khi cấu hình connection string trong `EduTrack-BE/.env`:

```bash
cd EduTrack-BE
corepack pnpm exec prisma migrate deploy
corepack pnpm prisma:generate
```

## Tính năng v1

- Supabase email/password authentication và protected dashboard.
- Quản lý học sinh, lớp, enrollment và buổi học.
- Điểm danh mobile-first, fee snapshot và học bù có liên kết buổi gốc.
- Tổng hợp học phí, payment partial, phân bổ oldest-first và void có lý do.
- Cấu hình ngân hàng, tạo VietQR và dashboard tổng hợp.

## Kiểm tra chất lượng

Chạy trong từng thư mục FE/BE:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```
