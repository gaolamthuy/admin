# Git Strategy - Migration Plan

## Mục tiêu

- Lưu trữ code Refine cũ vào nhánh riêng
- Đưa code mới (TanStack Query) lên main
- Đảm bảo có thể rollback nếu cần

## Các bước thực hiện

### 1. Tạo nhánh lưu trữ code cũ

```bash
# Đảm bảo đang ở main và code cũ đã commit
git checkout main
git pull origin main

# Tạo nhánh lưu trữ
git checkout -b legacy/refine-old
git push origin legacy/refine-old

# Quay lại main
git checkout main
```

### 2. Merge code mới vào main

```bash
# Nếu code mới đang ở nhánh khác (ví dụ: feature/new-stack)
git checkout main
git merge feature/new-stack --no-ff -m "feat: migrate from Refine to TanStack Query"

# Hoặc nếu code mới đã ở main local
git push origin main
```

### 3. Tag version cho legacy

```bash
# Tag version cuối cùng của Refine
git tag -a v1.0.0-legacy -m "Last version with Refine stack"
git push origin v1.0.0-legacy
```

### 4. Update main branch protection (nếu có)

- Đảm bảo main branch yêu cầu PR review
- Có thể tạo branch protection cho `legacy/refine-old` để tránh push nhầm

## Cấu trúc nhánh sau khi hoàn thành

```
main (code mới - TanStack Query)
├── legacy/refine-old (code cũ - Refine)
└── tags
    └── v1.0.0-legacy
```

## Rollback plan (nếu cần)

```bash
# Nếu cần rollback về code cũ
git checkout legacy/refine-old
git checkout -b hotfix/rollback-to-refine
# Fix issues nếu có
git checkout main
git merge hotfix/rollback-to-refine
```
