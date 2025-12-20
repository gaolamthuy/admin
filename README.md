# 🌾 Gạo Lâm Thúy - Admin Panel

Hệ thống quản lý sản phẩm và đơn hàng cho Gạo Lâm Thúy.

## 🚀 Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **TanStack Query** - Data fetching & state management
- **React Router** - Routing
- **Supabase** - Backend (Auth + Database)
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling

## 📦 Features

- 🔐 Authentication (Email/Password)
- 📦 Product Management (List, Show, Filters)
- 🛒 Purchase Order Management
- 👥 Role-based Access Control (Admin/User)
- ⭐ Favorite Products Filter
- 🎨 Modern UI với Shadcn UI

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

- [Core Architecture](./docs/CORE_ARCHITECTURE.md) - Architecture & patterns
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment strategy
- [Git Strategy](./.github/GIT_STRATEGY.md) - Git workflow

## 🔒 Environment Variables

Tạo file `.env` với:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📝 License

MIT
