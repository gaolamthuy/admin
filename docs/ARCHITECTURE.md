# Architecture Overview

## Tech Stack (Current)

- Next.js 15 (App Router), React 19, TypeScript strict
- UI: shadcn/ui, Radix UI, TailwindCSS v4
- Data/Auth: Supabase (PostgreSQL + Auth + RLS)
- State: TanStack Query v5, React Hook Form + Zod

## High-Level Flow

1. Client hits routes under `src/app/*` (App Router)
2. Middleware (`src/middleware.ts`) checks Supabase session and role
3. Layouts route users to `/(auth)`, `/(admin)`, `/(staff)` segments
4. UI built with shadcn components in `src/components/ui`
5. Data access via Supabase client in `src/lib/supabase.ts` and helpers in `src/lib/api.ts`

## Directory Structure

```
src/
  app/
    (auth)/auth/signin
    (admin)/admin/*
    (staff)/staff/*
    globals.css, layout.tsx, page.tsx
  components/
    ui/, layout/, staff/
  hooks/
  lib/
    api.ts, supabase.ts, theme.tsx, utils.ts
  middleware.ts
```

## Authentication & Authorization

- Supabase SSR client in middleware validates session cookies
- Role lookup from `glt_users` determines redirects between `/admin` and `/staff`
- Anonymous users are redirected to `/auth/signin`

## Data Model (Supabase)

- `auth.users` (built-in)
- `glt_users (id, user_id, role, created_at, note)`
- KiotViet-related tables: `kv_products`, `kv_customers`, `kv_invoices`, etc.

## Styling & Theming

- Tailwind v4 tokens defined in CSS; dark mode toggled via root class
- `src/lib/theme.tsx` provides context for theme switching

## Conventions

- Functional components only; JSDoc in Vietnamese
- Strict TypeScript; no `any`
- Server state with TanStack Query; client forms via RHF + Zod

## Future Notes

- Consider API layer extraction per domain in `src/lib/api/*`
- Add E2E tests and performance checks before large data features
