# Checklist cho Agent (Không làm gãy hệ thống)

## Trước khi code

- Đọc `docs/ARCHITECTURE.md`, `docs/ENVIRONMENT.md`, `docs/CONVENTIONS.md`
- Kiểm tra phiên bản trong `package.json` (Next 15, React 19)
- Tạo `.env.local` từ `.env.example` (KHÔNG commit)

## Khi thêm/chỉnh route

- Đặt file trong đúng segment `/(admin)` hoặc `/(staff)`
- Không bỏ qua middleware; thử login và verify redirect

## Khi truy cập dữ liệu

- Dùng Supabase client từ `src/lib/supabase.ts`
- Tạo hàm domain trong `src/lib/api.ts` hoặc tách file API theo domain
- Kiểm tra RLS hoạt động bằng tài khoản không phải admin

## UI/UX

- Sử dụng component từ `src/components/ui` (shadcn)
- Không hardcode màu; dùng class Tailwind và tokens

## TypeScript & Comments

- Không dùng `any`; thêm JSDoc tiếng Việt cho hàm export

## Secrets & Logs

- Không in key hoặc token ra console/logs
- Không dùng `SUPABASE_SERVICE_ROLE_KEY` ở client

## Trước khi mở PR

- Tự test: login, redirect theo role, CRUD cơ bản hoạt động
- Chạy lint: `npm run lint`
- Cập nhật docs nếu thay đổi kiến trúc/flow
