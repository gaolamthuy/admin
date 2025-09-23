# Coding Conventions

## React/Next

- Functional components only, hooks-based
- App Router, colocate component với route khi nhỏ; còn lại trong `src/components/*`
- Tránh client components nếu không cần; chỉ thêm `"use client"` khi bắt buộc

## TypeScript

- Strict mode, không dùng `any`; ưu tiên `unknown` + type guard
- Đặt tên rõ nghĩa, PascalCase cho components, camelCase cho biến/hàm

## State & Data

- Server state: TanStack Query v5
- Forms: React Hook Form + Zod, tách schema trong `src/lib/validations` nếu dùng lại

## UI & CSS

- shadcn/ui + Tailwind v4
- Dùng `tailwind-merge` để tránh class trùng lặp; `cva` cho variants

## Authz

- Tất cả route `/admin/*` và `/staff/*` được bảo vệ ở middleware
- Tra cứu role từ `glt_users`

## Comments (tiếng Việt)

- Dùng JSDoc trên component/hàm export
- Tập trung mô tả mục đích, tham số, return, lỗi

## Testing

- Unit cho hooks và util
- Component tests cho UI quan trọng

## Git

- Branch: `feat/*`, `fix/*`, `docs/*`
- Conventional Commits
