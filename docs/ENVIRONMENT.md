# Environment & Secrets

## Biến môi trường bắt buộc

Sao chép `.env.example` → `.env.local` và điền giá trị:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Webhook
NEXT_PUBLIC_WEBHOOK_URL=
NEXT_PUBLIC_WEBHOOK_BASIC_AUTH=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- Không commit `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không dùng ở client

## Hồ sơ môi trường

- Dev: `.env.local`
- Staging/Prod: dùng secret manager của hạ tầng, key giống dev

## Setup nhanh

- Node 20+
- Cài đặt: `npm ci`
- Chạy dev: `npm run dev`

## Ghi chú Supabase

- RLS cho `glt_users` và các bảng domain phải được bật
- Sau lần login đầu, seed 1 bản ghi role tối thiểu cho tài khoản của bạn

## Quy trình rotate & vệ sinh secret

- Rotate mỗi quý hoặc khi nghi ngờ lộ lọt
- Cập nhật đồng bộ ở server và CI
