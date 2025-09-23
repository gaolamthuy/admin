# Runbook (Operational)

## 1) Local development

- `npm ci`
- Tạo `.env.local` từ `.env.example`
- `npm run dev`

## 2) Tài khoản & phân quyền

- Đăng nhập qua Supabase Auth
- Thêm 1 row vào `glt_users` với `user_id` = auth.uid() và `role` = `admin` hoặc `staff`

## 3) Thêm trang mới dưới admin/staff

- Tạo route trong `src/app/(admin)/admin/...` hoặc `src/app/(staff)/staff/...`
- Tạo component UI trong `src/components/...` nếu dùng lại
- Middleware tự xử lý redirect theo role

## 4) Làm việc với dữ liệu

- Sử dụng hàm trong `src/lib/api.ts` hoặc tạo mới theo domain
- Mọi truy vấn phải tuân thủ RLS trên Supabase

## 5) Theming

- Dùng `ThemeProvider` từ `src/lib/theme.tsx`
- Không hardcode màu; dùng tokens Tailwind

## 6) Triển khai (guideline)

- Build: `npm run build`
- Dùng môi trường secrets, KHÔNG commit secret
- Sau deploy, kiểm tra middleware redirect và trang dashboard
