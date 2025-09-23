# Internal Portal - Next.js + shadcn/ui + Supabase

## 1) Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript (strict mode)
- **UI**: shadcn/ui + TailwindCSS + Radix UI + Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Forms**: React Hook Form + Zod validation
- **Data**: TanStack Query (server state), TanStack Table (data tables)
- **Styling**: TailwindCSS với custom theme tokens
- **Font**: Nunito (Google Fonts)
- **Icons**: Lucide React

## 2) Mục tiêu & Phạm vi

- **Mục tiêu**: Portal nội bộ cho quản trị hệ thống KiotViet
- **Phạm vi MVP**:
  - Authentication & Authorization (RBAC với Supabase)
  - Dashboard với KPI metrics từ KiotViet data
  - CRUD operations (Users, Products, Customers, Invoices)
  - Data tables với sorting/filtering/pagination
  - Form validation & error handling

## 3) Database Schema (Existing)

```sql
-- Auth users (Supabase built-in)
auth.users (id, email, created_at, ...)

-- Custom user roles
glt_users (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role text CHECK (role IN ('admin', 'staff')),
  created_at timestamptz,
  note text
)

-- KiotViet data tables
kv_products, kv_customers, kv_invoices, kv_invoice_details
glt_promotions, glt_print_jobs, glt_sync_logs
```

## 4) Routing Strategy

```
/ (root) → redirect to /auth/signin (if not authenticated)
/auth/signin → Login page (Supabase Auth)
/auth/signup → Register page (optional)
/admin/* → Admin dashboard & features (role: admin)
/staff/* → Staff dashboard & features (role: staff)
/customer/* → Customer area (future - currently empty)
```

### Route Protection Logic

- **Anonymous users**: Redirect to `/auth/signin`
- **Authenticated users**: Route based on role từ `glt_users` table
  - `admin` → `/admin/dashboard`
  - `staff` → `/staff/dashboard`
  - `customer` → `/customer/dashboard` (future)
- **Role-based access control**: Mỗi role có routes riêng, không cross-access

## 5) Supabase Authentication Setup

```typescript
// lib/supabase.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();

// Auth helpers
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getUserRole = async (userId: string) => {
  const { data } = await supabase
    .from("glt_users")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role;
};
```

## 6) RLS Policies (Existing)

```sql
-- User can only see their own data
CREATE POLICY "auth can select own glt_users" ON glt_users
  FOR SELECT USING (user_id = auth.uid())

-- Staff can update products
CREATE POLICY "staff can update glt_labelprint_favorite" ON kv_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM glt_users u
      WHERE u.user_id = auth.uid() AND u.role = 'staff'
    )
  )
```

## 7) Kiến trúc & Cấu trúc thư mục

```
src/
├── app/
│   ├── (auth)/
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   └── invoices/
│   │   └── layout.tsx
│   ├── (staff)/
│   │   ├── staff/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   └── layout.tsx
│   ├── (customer)/
│   │   └── customer/ (empty for now)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/
│   ├── admin/
│   ├── staff/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── utils.ts
│   ├── validations.ts
│   └── api.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useUser.ts
│   └── useRole.ts
├── types/
│   ├── auth.ts
│   ├── database.ts
│   └── api.ts
├── config/
│   └── supabase.ts
└── styles/
```

## 8) UI Design System

### Color Palette

```css
/* Light Mode */
:root {
  --background: 0 0% 100%;
  --foreground: 217.2 32.6% 17.5%;
  --primary: 48 96.6% 76.7%;
  --primary-foreground: 217.2 32.6% 17.5%;
  --secondary: 210 40% 98%;
  --secondary-foreground: 217.2 32.6% 17.5%;
  --muted: 210 40% 98%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 98%;
  --accent-foreground: 217.2 32.6% 17.5%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 48 96.6% 76.7%;
  --radius: 0.5rem;
}

/* Dark Mode */
.dark {
  --background: 217.2 32.6% 17.5%;
  --foreground: 210 40% 98%;
  --primary: 48 96.6% 76.7%;
  --primary-foreground: 217.2 32.6% 17.5%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 48 96.6% 76.7%;
}
```

### Typography

```css
/* Font Family */
@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap");

/* Typography Scale */
.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}
.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}
.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}
.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}
.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
```

### Spacing & Layout

```css
/* Spacing Scale */
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */

/* Border Radius */
--radius-sm: 0.25rem;
--radius: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.5rem;
```

### Component Variants

```typescript
// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Dark Mode Implementation

```typescript
// lib/theme.ts
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "portal-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
```

## 9) Authentication Flow

```typescript
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to signin if not authenticated
  if (
    (!session && req.nextUrl.pathname.startsWith("/admin")) ||
    req.nextUrl.pathname.startsWith("/staff")
  ) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Get user role and redirect accordingly
  if (session) {
    const { data: userRole } = await supabase
      .from("glt_users")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (
      userRole?.role === "admin" &&
      req.nextUrl.pathname.startsWith("/staff")
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (
      userRole?.role === "staff" &&
      req.nextUrl.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }
  }

  return res;
}
```

## 9) Key Features Implementation

- **Dashboard**: KPI cards từ KiotViet data (products, customers, invoices)
- **User Management**: CRUD với role assignment (admin only)
- **Product Management**: CRUD products, inventory tracking
- **Customer Management**: Customer data, groups, pricing
- **Invoice Management**: Sales data, reporting
- **Data Tables**: Advanced filtering, pagination, export
- **Forms**: Multi-step forms, file uploads, validation

## 10) Supabase Integration

```typescript
// lib/api.ts
export const getProducts = async () => {
  const { data, error } = await supabase
    .from("kv_products")
    .select("*")
    .eq("glt_visible", true)
    .order("glt_sort_order", { ascending: true });

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: number, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from("kv_products")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
};
```

## 11) Environment Configuration

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 12) Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0",
    "react-hook-form": "^7.47.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.11.0",
    "recharts": "^2.8.0"
  }
}
```

## 13) Component Library (shadcn/ui)

```bash
# Core components cần thiết
npx shadcn@latest add button input form table dialog dropdown-menu toast
npx shadcn@latest add card badge avatar separator
npx shadcn@latest add tabs accordion sheet sidebar
npx shadcn@latest add select checkbox radio-group
npx shadcn@latest add data-table
```

## 14) Development Standards

- **TypeScript**: Strict mode, no `any` types
- **Components**: Functional components với hooks
- **Naming**: PascalCase cho components, camelCase cho functions
- **Comments**: JSDoc comments bằng tiếng Việt
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## 15) Roadmap

- [ ] Setup Next.js project với App Router
- [ ] Install & configure shadcn/ui + TailwindCSS
- [ ] Setup Supabase client & authentication
- [ ] Implement middleware cho route protection
- [ ] Create admin dashboard layout
- [ ] Create staff dashboard layout
- [ ] Implement user management (admin)
- [ ] Add product management với KiotViet data
- [ ] Add customer management
- [ ] Add invoice management
- [ ] Add data tables với TanStack Table
- [ ] Add form components với validation
- [ ] Implement dark mode
- [ ] Add testing setup
- [ ] Performance optimization
- [ ] Documentation & deployment

## 16) Security Considerations

- **RLS Policies**: Đã có sẵn trong Supabase
- **Role-based Access**: Middleware + component-level protection
- **API Security**: Supabase built-in security
- **Data Validation**: Zod schemas cho tất cả inputs
- **Error Handling**: Global error boundary + toast notifications

---

_Last updated: $(date)_
_Version: 1.0.0_
_Supabase Integration: Ready_
