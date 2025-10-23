# 🏪 GLT Admin Panel

Admin panel nội bộ cho hệ thống GLT được xây dựng với **Refine + Ant Design + Supabase**.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5.x
- **Admin Framework**: Refine 5.x
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Cloudflare Pages (Static)

## 📋 Features

### ✅ Đã hoàn thành

- 🔐 **Authentication**: Supabase Auth với role-based access
- 📊 **Dashboard**: Thống kê tổng quan hệ thống
- 🛍️ **Products Management**: CRUD cho sản phẩm
- 👥 **Customers Management**: CRUD cho khách hàng
- 🧾 **Invoices Management**: CRUD cho hóa đơn
- 📱 **Responsive Design**: Tối ưu cho mobile/desktop
- 🎨 **Modern UI**: Ant Design với theme tùy chỉnh

### 🔄 Đang phát triển

- 📈 **Advanced Analytics**: Charts và reports
- 🔍 **Search & Filters**: Tìm kiếm nâng cao
- 📤 **Export/Import**: Xuất/nhập dữ liệu
- 🔔 **Notifications**: Thông báo real-time
- 👤 **User Management**: Quản lý users và roles

## 🛠️ Setup & Development

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment variables

Tạo file `.env.local`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_TITLE=Admin Panel
VITE_APP_DESCRIPTION=Internal Admin Panel for GLT System
```

### 3. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### 4. Build cho production

```bash
npm run build
```

## 🗄️ Database Schema

### Tables chính:

- **glt_users**: Quản lý users và roles
- **kv_products**: Sản phẩm từ KiotViet
- **kv_customers**: Khách hàng từ KiotViet
- **kv_invoices**: Hóa đơn từ KiotViet
- **glt_payment**: Xử lý thanh toán
- **glt_promotions**: Khuyến mãi

## 🔐 Authentication

### User Roles:

- **admin**: Full access
- **staff**: Limited access

### Login Flow:

1. User đăng nhập với email/password
2. Supabase Auth xác thực
3. Lấy role từ `glt_users` table
4. Redirect dựa trên permissions

## 📱 Pages & Routes

### Public Routes:

- `/login` - Trang đăng nhập

### Protected Routes:

- `/` - Dashboard
- `/products` - Danh sách sản phẩm
- `/products/create` - Tạo sản phẩm mới
- `/products/edit/:id` - Chỉnh sửa sản phẩm
- `/products/show/:id` - Xem chi tiết sản phẩm
- `/customers` - Danh sách khách hàng
- `/customers/create` - Tạo khách hàng mới
- `/customers/edit/:id` - Chỉnh sửa khách hàng
- `/customers/show/:id` - Xem chi tiết khách hàng
- `/invoices` - Danh sách hóa đơn
- `/invoices/create` - Tạo hóa đơn mới
- `/invoices/edit/:id` - Chỉnh sửa hóa đơn
- `/invoices/show/:id` - Xem chi tiết hóa đơn

## 🚀 Deployment

### Cloudflare Pages:

1. Build project: `npm run build`
2. Upload `dist` folder lên Cloudflare Pages
3. Cấu hình environment variables trong Cloudflare dashboard
4. Deploy!

### Environment Variables cho Production:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## 🏗️ Project Structure

```
src/
├── components/
│   └── layout/           # Layout components
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── auth.ts          # Auth utilities
├── pages/
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard
│   ├── products/        # Products CRUD
│   ├── customers/       # Customers CRUD
│   └── invoices/        # Invoices CRUD
├── providers/
│   └── authProvider.ts  # Refine auth provider
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## 🔧 Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📚 Documentation

- [Refine Documentation](https://refine.dev/docs/)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Backend**: Supabase + PostgreSQL
- **Frontend**: Refine + Ant Design + React
- **DevOps**: Cloudflare Pages
- **Database**: PostgreSQL với RLS enabled

---

**Made with ❤️ by GLT Team**
