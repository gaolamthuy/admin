# Internal Portal (Next.js 15 + Supabase)

## Quick Start

1. Sao chép `.env.example` → `.env.local` và điền giá trị
2. Cài đặt: `npm ci`
3. Chạy dev: `npm run dev`

## Tài liệu

- Kiến trúc: `docs/ARCHITECTURE.md`
- Môi trường & secrets: `docs/ENVIRONMENT.md`
- Quy ước code: `docs/CONVENTIONS.md`
- Runbook: `docs/RUNBOOK.md`
- Checklist cho agent: `docs/CHECKLIST_AGENT.md`
- Bảo mật: `docs/SECURITY.md`
- Hướng dẫn chi tiết: `docs/PORTAL_GUIDE.md`

## Stack

- Next.js 15 (App Router), React 19, TypeScript strict
- shadcn/ui + TailwindCSS v4, Radix UI
- Supabase (Auth + PostgreSQL + RLS)
- TanStack Query, React Hook Form + Zod
