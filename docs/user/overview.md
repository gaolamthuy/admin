# Internal Portal - Next.js + shadcn/ui

## 1) Tech stack

- Next.js (App Router), TypeScript (strict), TailwindCSS, shadcn/ui (Radix), React Hook Form + Zod, TanStack Query, TanStack Table, Lucide icons

## 2) Mục tiêu & phạm vi

- Mục tiêu: Portal nội bộ (dashboard, bảng dữ liệu, form, phân quyền)
- Phạm vi MVP: Auth, Layout, Table, Form, Charts cơ bản

## 3) Kiến trúc & thư mục

- `app/` routing, `components/` (ui, shared), `lib/` (utils, api), `hooks/`, `styles/`, `types/`, `config/`, `features/` theo domain
- Alias: `@/components`, `@/lib`, `@/features/*`

## 4) UI & theming

- shadcn/ui + Tailwind theme tokens (brand, semantic)
- Dark mode: class strategy (`<html class="dark">`)
- Icon: Lucide
- Spacing/Radius/Shadow theo scale Tailwind

## 5) Conventions

- TypeScript strict, không dùng `any`
- Component: functional + hooks, server-first (App Router)
- Naming: camelCase, PascalCase cho component
- Commit: Conventional Commits
- Lint/Format: ESLint + Prettier

## 6) Data & API

- Fetch: TanStack Query (SSR/ISR khi cần)
- DTO/Schema: Zod
- ENV: `.env.local` (API*BASE_URL, AUTH*\*)

## 7) AuthZ/AuthN

- NextAuth (hoặc JWT custom)
- RBAC: role/permission strategy
- Route guards (server + client)

## 8) Table & Form

- Table: TanStack Table (sorting, filter, pagination)
- Form: React Hook Form + Zod, field components từ shadcn

## 9) Quality

- Testing: Vitest/RTL, e2e Playwright
- Accessibility (a11y), keyboard nav
- Performance budgets, images, code-splitting

## 10) CI/CD & DevOps

- Node version, PNPM/NPM lock
- Lint/test trong CI, preview deploy (tùy môi trường)
- Error tracking (Sentry), logging

## 11) Roadmap

- [ ] Setup base (Tailwind, shadcn, theme)
- [ ] Layout: AppShell (sidebar/topbar), breadcrumbs
- [ ] Auth flow + RBAC
- [ ] Table CRUD mẫu
- [ ] Form mẫu (create/update)
- [ ] Charts (Recharts/Tremor)
- [ ] Testing cơ bản + CI
