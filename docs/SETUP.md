# 🚀 Quick Setup Guide

## 1. Cấu hình Supabase

### Lấy Supabase Anon Key:

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Copy **anon public** key

### Cập nhật .env.local:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. Chạy ứng dụng

```bash
# Cài đặt dependencies (nếu chưa)
npm install

# Chạy development server
npm run dev
```

## 3. Truy cập ứng dụng

- **URL**: http://localhost:3000
- **Login**: Sử dụng tài khoản Supabase Auth
- **Default route**: Sẽ redirect đến `/login`

## 4. Test với dữ liệu thực

Ứng dụng đã được cấu hình để kết nối với database hiện tại:

- **Products**: `kv_products` table
- **Customers**: `kv_customers` table
- **Invoices**: `kv_invoices` table

## 5. Deploy lên Cloudflare Pages

```bash
# Build project
npm run build

# Upload dist/ folder lên Cloudflare Pages
# Cấu hình environment variables trong Cloudflare dashboard
```

## 🔧 Troubleshooting

### Lỗi kết nối Supabase:

- Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
- Đảm bảo RLS policies đã được cấu hình đúng

### Lỗi authentication:

- Kiểm tra `glt_users` table có dữ liệu
- Đảm bảo user đã được tạo trong Supabase Auth

### Lỗi build:

- Chạy `npm run build` để kiểm tra lỗi TypeScript
- Kiểm tra tất cả imports và exports

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:

1. Console logs trong browser
2. Network tab để xem API calls
3. Supabase logs trong dashboard
