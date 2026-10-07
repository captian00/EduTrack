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

## Deploy lên Vercel

Tạo **hai Vercel project** từ cùng Git repository:

1. Frontend: đặt Root Directory là `EduTrack-FE`, Framework Preset là Next.js.
2. Backend: đặt Root Directory là `EduTrack-BE`, để Vercel tự nhận diện NestJS từ `src/main.ts`; không cấu hình Output Directory.

Nên dùng Node.js 22 cho cả hai project. Các `package.json` đã khóa `engines.node` về `22.x`.

### Biến môi trường Frontend

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://<backend-project>.vercel.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-publishable-key>
```

### Biến môi trường Backend

```dotenv
NODE_ENV=production
DATABASE_URL=<supabase-transaction-pooler-url-port-6543>
DIRECT_URL=<supabase-direct-or-session-pooler-url>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<supabase-publishable-key>
CORS_ORIGIN=https://<frontend-project>.vercel.app
CRON_SECRET=<random-secret-at-least-16-characters>
```

- `DATABASE_URL` dùng cho API runtime và nên trỏ tới Supabase transaction pooler với `sslmode=require`, `pgbouncer=true` và `connection_limit=1`.
- `DIRECT_URL` chỉ dùng cho Prisma migrations. Không chạy migration tự động trong Preview deployment.
- Ưu tiên copy connection string từ Supabase Dashboard; nếu tự điền mật khẩu có ký tự đặc biệt như `@`, phải URL-encode mật khẩu.
- Nếu có nhiều domain Frontend, phân tách chúng trong `CORS_ORIGIN` bằng dấu phẩy.
- Thêm production URL và preview URL cần dùng vào Supabase Authentication → URL Configuration.

Trước lần deploy Backend đầu tiên, áp dụng migration từ máy local hoặc CI tin cậy:

```bash
cd EduTrack-BE
corepack pnpm exec prisma migrate deploy
```

Backend tự chạy `prisma generate` khi cài dependency và build. Cleanup ghi chú được Vercel Cron gọi mỗi ngày lúc 02:00 theo giờ Việt Nam qua `/api/v1/cron/student-notes`; Vercel tự gửi `CRON_SECRET` trong Bearer token.

Sau khi Backend có URL chính thức, cập nhật `NEXT_PUBLIC_API_BASE_URL` của Frontend rồi redeploy Frontend. Kiểm tra `GET https://<backend-project>.vercel.app/api/v1/health` trước khi đăng nhập.
