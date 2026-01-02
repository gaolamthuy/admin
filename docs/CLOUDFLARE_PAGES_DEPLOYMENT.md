# 🚀 Cloudflare Pages Deployment Guide

Hướng dẫn deploy project lên Cloudflare Pages.

## 📋 Prerequisites

- GitHub repository đã setup
- Cloudflare account
- Project đã có `pnpm-lock.yaml` (package manager: pnpm)

## ⚙️ Cấu hình Cloudflare Pages

### 1. Build Settings

Trong Cloudflare Pages Dashboard → Settings → Builds & deployments:

```
Framework preset: Vite
Build command: pnpm build
Build output directory: dist
Root directory: / (hoặc để trống)
```

**Lưu ý quan trọng:**
- ✅ **Nên dùng `pnpm build`** vì project đang dùng pnpm (có `pnpm-lock.yaml`)
- ❌ Không dùng `npm run build` vì sẽ gây conflict với lock files
- Cloudflare tự động detect pnpm nếu có `pnpm-lock.yaml`, nhưng nên specify rõ ràng

### 2. Environment Variables

Thêm các biến môi trường trong **Settings → Environment variables**:

#### Production Environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
VITE_N8N_WEBHOOK_BASIC_AUTH=username:password
VITE_N8N_WEBHOOK_HEADER_KEY=X-Custom-Header
VITE_N8N_WEBHOOK_HEADER_VALUE=your-header-value
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
VITE_CLOUDINARY_FOLDER=production/products
NODE_ENV=production
```

#### Secrets (Cloudflare Pages Functions):

Trong **Settings → Variables and Secrets** → Secrets:

```env
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Lưu ý:** Secrets chỉ dùng cho Cloudflare Pages Functions (server-side), không expose ra client.

### 3. Build Configuration

#### Option 1: Tự động detect (Recommended)

Cloudflare sẽ tự động detect pnpm từ `pnpm-lock.yaml`:

```
Build command: pnpm build
```

#### Option 2: Explicit configuration

Nếu muốn rõ ràng hơn, có thể tạo file `package.json` với `packageManager` field:

```json
{
  "packageManager": "pnpm@8.x.x"
}
```

### 4. Build Output

Vite build output mặc định là `dist/`, đảm bảo cấu hình:

```
Build output directory: dist
```

## 🔧 Troubleshooting

### Issue: Build fails với "Command not found: pnpm"

**Giải pháp:**
1. Đảm bảo `pnpm-lock.yaml` tồn tại trong repo
2. Cloudflare sẽ tự động install pnpm nếu detect `pnpm-lock.yaml`
3. Nếu vẫn lỗi, thêm build command: `npm install -g pnpm && pnpm build`

### Issue: Build fails với "Cannot find module"

**Giải pháp:**
1. Kiểm tra `pnpm-lock.yaml` đã commit chưa
2. Đảm bảo không có `package-lock.json` (nên xóa để tránh conflict)
3. Thử clear build cache trong Cloudflare Dashboard

### Issue: Environment variables không load

**Giải pháp:**
1. Kiểm tra tên biến có prefix `VITE_` chưa (Vite chỉ expose biến có prefix này)
2. Rebuild sau khi thêm environment variables
3. Kiểm tra trong browser console xem biến có được inject không

## 📝 Best Practices

1. **Lock Files:**
   - ✅ Chỉ giữ `pnpm-lock.yaml`
   - ❌ Xóa `package-lock.json` để tránh confusion
   - Commit lock file vào git

2. **Build Command:**
   - ✅ Dùng `pnpm build` (explicit)
   - ✅ Hoặc chỉ `build` (Cloudflare auto-detect)
   - ❌ Không dùng `npm run build` khi đang dùng pnpm

3. **Environment Variables:**
   - Tất cả biến client-side phải có prefix `VITE_`
   - Secrets chỉ dùng cho Cloudflare Functions
   - Không commit `.env` files

4. **Build Performance:**
   - pnpm nhanh hơn npm (parallel installs)
   - Tiết kiệm disk space hơn (hard links)
   - Cache tốt hơn cho CI/CD

## 🔗 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [pnpm Documentation](https://pnpm.io/)

