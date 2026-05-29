# Design System - Gao Lam Thuy Admin

## 1. Semantic Colors - Mau theo ngu nghia

### 1.1 Price/Cost Changes (Quan trong - Retail Agriculture)

Day la admin panel quan ly ban le san pham nong nghiep (gao). Logic mau nghich voi thi truong chung:

| Context | Mau | Class | Y nghia |
|---------|-----|-------|---------|
| Cost TANG (len) | **Do** | `text-destructive` | XAU - chi phi tang, loi nhuan giam |
| Cost GIAM (xuong) | **Xanh la** | `text-green-600 dark:text-green-400` | TOT - chi phi giam, loi nhuan tang |
| Khong doi | **Mac dinh** | `text-muted-foreground` | Khong co thay doi |

**Vi du code:**
```tsx
className={`font-medium ${
  costDiff > 0
    ? 'text-destructive'          // cost tang = do (xau)
    : costDiff < 0
      ? 'text-green-600 dark:text-green-400'  // cost giam = xanh (tot)
      : ''                        // khong doi
}`}
```

**Mui ten (Arrows):**

| Hướng | Ky hieu | Class kem |
|-------|---------|-----------|
| Tang (len) | `↑ ` | `<ArrowUp className="h-3 w-3" />` |
| Giam (xuong) | `↓ ` | `<ArrowDown className="h-3 w-3" />` |
| Kem dau | `+` / `-` | Tu dong theo gia tri |

**Ap dung cho:**
- `dir === 'up'` / `dir === 'down'` trong changelog
- `costDiff` / `costDifference` trong bang so sanh gia
- `costDiffFromLatestPo` trong card/table/list
- `baseprice_diff` trong SyncPriceConfirmDialog

**Luu y ve logic mau cho tung loai diff:**

| Loai diff | Tang (duong) | Giam (am) |
|-----------|-------------|-----------|
| **Cost** | `text-destructive` (xau) | `text-green-600` (tot) |
| **Baseprice** | `text-destructive` (xau - ban gia tang) | `text-green-600` (tot - gia giam) |
| **Changelog dir** | `dir=up`: `text-green-600` | `dir=down`: `text-destructive` |

**Snippet tong quat cho diff:**
```tsx
const diffColor = (value: number) =>
  value > 0
    ? 'text-destructive'
    : value < 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-muted-foreground';

const diffArrow = (value: number) =>
  value > 0
    ? <><ArrowUp className="h-3 w-3 inline" /> {'+'}</>
    : value < 0
      ? <><ArrowDown className="h-3 w-3 inline" /></>
      : null;
```

### 1.2 Payment Provider Colors

| Provider | Light | Dark |
|----------|-------|------|
| MoMo | `bg-pink-100 text-pink-800` | `dark:bg-pink-900/40 dark:text-pink-100` |
| ACB | `bg-sky-100 text-sky-800` | `dark:bg-sky-900/40 dark:text-sky-100` |
| Vietcombank | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-900/40 dark:text-emerald-100` |
| Khac | `bg-muted text-muted-foreground` | `dark:bg-muted/40` |
| Test | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900/40 dark:text-yellow-100` |

### 1.3 Status Badges

| Trang thai | Badge variant | Vi du |
|------------|--------------|-------|
| Hoat dong / Active | `default` | `variant={record.is_active ? 'default' : 'secondary'}` |
| Tam dung / Inactive | `secondary` | |
| Khuyen mai / Promotion | `destructive` | `variant="destructive"` |
| Hien thi / Visible | `default` | `variant={record.glt_visible ? 'default' : 'outline'}` |
| An / Hidden | `outline` | |
| Role Admin | `default` | |
| Role Staff | `secondary` | |

### 1.4 Semantic Tokens (tu dong dark mode)

Su dung shadcn semantic tokens - **khong can them `dark:` variant**:

- `text-foreground`, `text-muted-foreground`
- `bg-background`, `bg-muted`
- `text-primary`, `text-destructive`
- `bg-card`, `text-card-foreground`
- `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`

### 1.5 Khi nao can `dark:` variant?

Chi can khi dung **Tailwind color truc tiep** (khong phai semantic token):

```tsx
// CAN dark: variant
'text-green-600 dark:text-green-400'
'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-100'

// KHONG CAN dark: variant - tu dong adapt
'text-destructive'
'text-muted-foreground'
'bg-primary/10 text-primary'
```

---

## 2. Layout Patterns

### 2.1 Page Wrapper (bat buoc cho moi page)

```tsx
<div className="container mx-auto py-6 space-y-6">
```

### 2.2 Card Container (chinh)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Tieu de trang</CardTitle>
  </CardHeader>
  <CardContent>
    {/* noi dung */}
  </CardContent>
</Card>
```

### 2.3 Card Header voi Search/Actions

```tsx
<CardHeader>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <CardTitle>Tieu de</CardTitle>
    {/* search hoac action buttons */}
  </div>
</CardHeader>
```

### 2.4 Form Pages (max-w-4xl)

```tsx
<div className="container mx-auto py-6 space-y-6 max-w-4xl">
```

### 2.5 Auth Pages (centered)

```tsx
<div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-md w-full space-y-8">
```

---

## 3. Grid Patterns

| Loai grid | Class | Su dung |
|-----------|-------|---------|
| Info 2 cot | `grid grid-cols-1 md:grid-cols-2 gap-6` | Show/detail pages |
| Card grid 3 cot | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` | Purchase orders |
| Product cards | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4` | Products |
| Payment cards | `grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4` | Payments |
| Settings form | `grid grid-cols-1 md:grid-cols-4 gap-4` | Product settings |

---

## 4. Component Conventions

### 4.1 Table Pattern

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow><TableHead>...</TableHead></TableRow>
    </TableHeader>
    <TableBody>
      <TableRow><TableCell>...</TableCell></TableRow>
    </TableBody>
  </Table>
</div>
```

### 4.2 Badge

```tsx
<Badge variant="default|secondary|outline|destructive">Text</Badge>
```

### 4.3 Button Variants

| Variant | Su dung |
|---------|---------|
| `default` | Primary action |
| `destructive` | Danger action (delete, etc.) |
| `outline` | Secondary action, back button |
| `secondary` | Alternative secondary |
| `ghost` | Tertiary, navigation |
| `link` | Text-only link |

### 4.4 Button Sizes

| Size | Class | Su dung |
|------|-------|---------|
| `default` | `h-9` | Standard |
| `sm` | `h-8` | Compact, inline |
| `lg` | `h-10` | Emphasis |
| `icon` | `size-9` | Icon-only |
| `icon-sm` | `size-8` | Small icon-only |

---

## 5. Icon Conventions

**Thu vien:** `lucide-react` (duy nhat)

| Size | Su dung |
|------|---------|
| `h-3 w-3` | Inline indicators, mini loaders |
| `h-4 w-4` | **Mac dinh** - buttons, menu items, table cells, toggles |
| `h-5 w-5` | Sidebar header logo |
| `h-6 w-6` | Provider logos |
| `h-8 w-8` | Full-page loaders |

**Loader icon:** Luon dung `Loader2` voi `animate-spin`:
```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## 6. Loading States

### 6.1 Inline Centered Spinner (chinh)

```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin" />
</div>
```

### 6.2 Button Loading

```tsx
<Button disabled={mutation.isPending}>
  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Label
</Button>
```

### 6.3 Skeleton Patterns

Card grid skeleton:
```tsx
{Array.from({ length: 10 }).map((_, i) => (
  <div key={i} className="space-y-4">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
  </div>
))}
```

Table row skeleton:
```tsx
{Array.from({ length: 5 }).map((_, i) => (
  <TableRow key={i}>
    <TableCell><Skeleton className="w-10 h-10 rounded" /></TableCell>
    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
  </TableRow>
))}
```

### 6.4 Inline Mini Loader (auto-save)

```tsx
{mutation.isPending && (
  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
    <Loader2 className="h-3 w-3 animate-spin" />
    Dang luu...
  </div>
)}
```

### 6.5 Empty State

```tsx
<div className="text-center py-12">
  <p className="text-muted-foreground">Message</p>
</div>
```

---

## 7. Form Patterns

### 7.1 Setup (react-hook-form + zod)

```tsx
const schema = z.object({
  field: z.string().min(1, 'Required'),
});
type FormType = z.infer<typeof schema>;

const form = useForm<FormType>({
  resolver: zodResolver(schema),
  defaultValues: { field: '' },
});
```

### 7.2 Form Rendering

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField control={form.control} name="field" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl><Input {...field} disabled={mutation.isPending} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

### 7.3 Auto-Save (onBlur + Enter)

```tsx
<Input
  onBlur={() => form.handleSubmit(onSubmit)()}
  onKeyDown={e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  }}
/>
```

### 7.4 Submission Pattern

```tsx
const onSubmit = async (data: FormType) => {
  try {
    await mutation.mutateAsync(data);
    toast.success('Thanh cong');
    navigate('/target');
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : 'Loi mac dinh');
  }
};
```

---

## 8. Toast/Notification (sonner)

### 8.1 Simple

```tsx
toast.success('Message');
toast.error('Message');
```

### 8.2 With Description

```tsx
toast.success('Title', { description: 'Details' });
```

### 8.3 Promise Pattern

```tsx
await toast.promise(mutationPromise, {
  loading: 'Dang xu ly...',
  success: 'Thanh cong',
  error: 'That bai',
});
```

---

## 9. Admin Conditional Rendering

### 9.1 Hook (chinh)

```tsx
const { isAdmin } = useIsAdmin();
```

### 9.2 Inline Conditional

```tsx
{isAdmin && <AdminComponent />}
```

### 9.3 Wrapper Components

```tsx
<AdminOnly><Content /></AdminOnly>
<AdminFilters><FilterComponent /></AdminFilters>
<AdminButtons><ButtonComponent /></AdminButtons>
<AdminFeature feature="priceDifference"><Content /></AdminFeature>
```

### 9.4 Prop Drilling

```tsx
<Component isAdmin={isAdmin} />
```

---

## 10. Search Input Pattern

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input placeholder="Tim kiem..." className="pl-10" />
</div>
```

With clear button:
```tsx
<button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
  <X className="h-4 w-4" />
</button>
```

---

## 11. Pagination Pattern

Client-side pagination, mac dinh 10 items/page:

```tsx
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const paginatedItems = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return items.slice(start, start + itemsPerPage);
}, [items, currentPage]);
const totalPages = Math.ceil(items.length / itemsPerPage);

useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
}, [currentPage, totalPages]);
```

Pagination boundary styling:
```tsx
className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
```

---

## 12. Dark Mode

- **Strategy:** CSS class tren `<html>` (`light` / `dark`)
- **Storage:** `localStorage` key `'app-theme'`
- **Auto-detection:** `prefers-color-scheme: dark` khi lan dau
- **Toggle:** `theme-toggle.tsx` - Animated Sun/Moon

---

## 13. Typography & Fonts

| Font | Su dung |
|------|---------|
| Inter (primary) | Body text, UI |
| Noto Sans Vietnamese | Vietnamese text support |
| Monospace | `font-mono` cho so tien, ma san pham |

**Font feature settings:**
```css
font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
```

**Border radius:** `--radius: 0.5rem` (8px)

---

## 14. Navigation

### 14.1 Back Button

```tsx
<Button variant="outline" onClick={() => navigate(-1)}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Quay lai
</Button>
```

### 14.2 Sidebar Menu

- Active: `variant="default"`, detect via `location.pathname.startsWith(item.path)`
- Inactive: `variant="ghost"`
- Admin-only items: `adminOnly` flag, filter via `useIsAdmin()`

### 14.3 Default Routes

- `/` redirect to `/products`
- `*` (404) redirect to `/products`
