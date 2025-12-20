# Git Migration - Quick Guide

## ⚠️ Tình trạng hiện tại

- Đang ở branch `main`
- Code mới (TanStack Query) **chưa commit** (nhiều files modified/untracked)
- Code cũ (Refine) đã có trên `origin/main`

## ✅ Chiến lược được khuyến nghị

**KHÔNG cần đổi tên nhánh main**. Làm theo thứ tự sau:

### Option 1: Tạo branch mới cho code mới (Khuyến nghị)

```bash
# 1. Tạo branch mới và commit code mới
git checkout -b feature/migrate-to-tanstack-query
git add .
git commit -m "feat: migrate from Refine to TanStack Query"
git push origin feature/migrate-to-tanstack-query

# 2. Quay lại main, tạo legacy branch từ code cũ
git checkout main
git reset --hard origin/main  # Đảm bảo main sạch (code cũ)
git checkout -b legacy/refine-old
git push origin legacy/refine-old
git tag -a v1.0.0-legacy -m "Last Refine version"
git push origin v1.0.0-legacy

# 3. Merge code mới vào main
git checkout main
git merge feature/migrate-to-tanstack-query --no-ff
git push origin main
```

### Option 2: Commit trực tiếp lên main (Nhanh hơn, nhưng ít an toàn)

```bash
# 1. Tạo legacy branch từ main hiện tại TRƯỚC
git checkout -b legacy/refine-old
git push origin legacy/refine-old
git tag -a v1.0.0-legacy -m "Last Refine version"
git push origin v1.0.0-legacy

# 2. Quay lại main và commit code mới
git checkout main
git add .
git commit -m "feat: migrate from Refine to TanStack Query"
git push origin main
```

## 🎯 Kết quả mong muốn

```
main (code mới - TanStack Query) ← Production
├── legacy/refine-old (code cũ - Refine) ← Backup
└── v1.0.0-legacy (tag)
```

## ⚠️ Lưu ý

- **KHÔNG cần đổi tên nhánh main** trên GitHub
- Code cũ sẽ được lưu trong `legacy/refine-old`
- Code mới sẽ ở `main` (production)
- Có thể rollback về `legacy/refine-old` bất cứ lúc nào

## 📋 Checklist trước khi push

- [ ] Build thành công (`npm run build`)
- [ ] Preview thành công (`npm run preview`)
- [ ] Không có lỗi TypeScript
- [ ] Đã test các flows chính (login, product list, etc.)
- [ ] Environment variables đã setup đúng
