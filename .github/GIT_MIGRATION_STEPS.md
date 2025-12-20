# Git Migration Steps - Chi tiết từng bước

## Tình trạng hiện tại

- Đang ở branch `main`
- Code mới (TanStack Query) chưa commit
- Code cũ (Refine) đã có trên `origin/main`

## Các bước thực hiện

### Bước 1: Commit code mới vào branch mới

```bash
# Tạo branch mới cho code mới
git checkout -b feature/migrate-to-tanstack-query

# Add tất cả changes
git add .

# Commit code mới
git commit -m "feat: migrate from Refine to TanStack Query

- Replace Refine hooks with TanStack Query
- Implement custom Supabase hooks
- Add URL state management for filters
- Update product list/show pages
- Add admin features management
- Clean up legacy docs"

# Push branch mới lên remote
git push origin feature/migrate-to-tanstack-query
```

### Bước 2: Tạo nhánh lưu trữ code cũ

```bash
# Quay lại main (code cũ)
git checkout main

# Đảm bảo main sạch (code cũ)
git reset --hard origin/main

# Tạo nhánh legacy từ main hiện tại
git checkout -b legacy/refine-old

# Push nhánh legacy lên remote
git push origin legacy/refine-old

# Tag version cho legacy
git tag -a v1.0.0-legacy -m "Last version with Refine stack"
git push origin v1.0.0-legacy
```

### Bước 3: Merge code mới vào main

```bash
# Quay lại main
git checkout main

# Merge code mới vào main
git merge feature/migrate-to-tanstack-query --no-ff -m "feat: migrate from Refine to TanStack Query"

# Push main mới lên remote
git push origin main
```

### Bước 4: Cleanup (optional)

```bash
# Xóa branch feature sau khi merge (nếu muốn)
git branch -d feature/migrate-to-tanstack-query
git push origin --delete feature/migrate-to-tanstack-query
```

## Kết quả

Sau khi hoàn thành:

- `main` → Code mới (TanStack Query)
- `legacy/refine-old` → Code cũ (Refine)
- `v1.0.0-legacy` → Tag của code cũ

## Rollback (nếu cần)

```bash
# Nếu cần rollback về code cũ
git checkout legacy/refine-old
git checkout -b hotfix/rollback
# Fix issues
git checkout main
git merge hotfix/rollback
```
