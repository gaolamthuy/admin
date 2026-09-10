/**
 * Flow "Sửa template" tại step 2 của PurchaseOrderCreate:
 * Admin thêm SP qua SupplierTemplateDialog → persist glt_supplier_po_templates
 * + SP được auto-chọn vào đơn hôm nay. Non-admin không thấy nút.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/supabase-session', () => ({
  ensureSessionActive: vi.fn().mockResolvedValue(undefined),
}));

const useIsAdminMock = vi.fn(() => ({ isAdmin: true, loading: false }));
vi.mock('@/hooks/useAuth', () => ({
  useIsAdmin: () => useIsAdminMock(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// ---- supabase mock ----
type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: unknown };
type Builder = {
  select: () => Builder;
  eq: () => Builder;
  or: () => Builder;
  order: () => Builder;
  limit: () => Builder;
  upsert: () => Builder;
  delete: () => Builder;
  single: () => QueryResult;
  then: (
    res: (r: QueryResult) => unknown,
    rej: (e: unknown) => unknown
  ) => Promise<unknown>;
  catch: (rej: (e: unknown) => unknown) => Promise<unknown>;
  finally: (fn: () => unknown) => Promise<unknown>;
};

const createBuilder = (rows: Row[]): Builder => {
  const promise = Promise.resolve({ data: rows, error: null });
  const builder = {
    select: () => builder,
    eq: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    upsert: () => builder,
    delete: () => builder,
    single: () => promise,
    then: (res: (r: QueryResult) => unknown, rej: (e: unknown) => unknown) =>
      promise.then(res, rej),
    catch: (rej: (e: unknown) => unknown) => promise.catch(rej),
    finally: (fn: () => unknown) => promise.finally(fn),
  };
  return builder;
};

const upsertSpy = vi.fn();
const supabaseFrom = vi.fn((table: string) => {
  switch (table) {
    case 'v_suppliers_admin':
      return createBuilder([
        {
          kiotviet_id: 111,
          name: 'NCC Gạo',
          code: 'NCC1',
          contact_number: null,
          address: null,
          branch_id: 1,
          total_invoice: 10,
          last_purchase_date: null,
          last_master_unit_quantity: null,
          po_template_products: null,
        },
      ]);
    case 'v_supplier_po_templates':
      return createBuilder([
        {
          supplier_kiotviet_id: 111,
          product_id: 1,
          sort_order: 0,
          created_at: '2026-01-01',
          product_code: 'P1',
          product_name: 'Gạo A (kg)',
          order_template: null,
          images: null,
          child_units: null,
          master_unit: 'kg',
        },
      ]);
    case 'v_products_admin':
      return createBuilder([
        {
          kiotviet_id: 2,
          product_code: 'P2',
          product_name: 'Gạo B (kg)',
          category_name: 'Gạo',
          order_template: null,
          child_unit_info: null,
        },
      ]);
    case 'kv_products':
      return createBuilder([
        {
          kiotviet_id: 2,
          code: 'P2',
          full_name: 'Gạo B (kg)',
          unit: 'kg',
          order_template: null,
          master_unit_id: null,
          base_price: 1000,
          conversion_value: null,
        },
      ]);
    case 'glt_supplier_po_templates': {
      const b = createBuilder([]);
      const withUpsert: Builder = {
        ...b,
        upsert: () => {
          upsertSpy();
          return b;
        },
      };
      return withUpsert;
    }
    default:
      return createBuilder([]);
  }
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (t: string) => supabaseFrom(t) },
}));

import { PurchaseOrderCreate } from '../PurchaseOrderCreate';

// cmdk cần ResizeObserver là class constructor
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error override global cho test
global.ResizeObserver = ResizeObserverMock;

const renderPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PurchaseOrderCreate />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const goToStep2 = async () => {
  const supplierCard = await screen.findByText('NCC Gạo');
  fireEvent.click(supplierCard);
  await waitFor(() => {
    expect(screen.getByText('Gạo A')).toBeInTheDocument();
  });
};

describe('PO create — Sửa template tại step 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIsAdminMock.mockReturnValue({ isAdmin: true, loading: false });
  });

  it('admin thêm SP qua Sửa template → persist + auto-chọn vào đơn', async () => {
    renderPage();
    await goToStep2();

    // Mở dialog template từ step 2
    fireEvent.click(screen.getByRole('button', { name: /sửa template/i }));
    await screen.findByText('Template nhập hàng');

    // Mở dialog search bên trong
    fireEvent.click(screen.getByRole('button', { name: /thêm sản phẩm/i }));

    // Chọn SP rồi bấm Thêm
    const item = await screen.findByText('Gạo B');
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText('Đã chọn 1 SP')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^thêm \(1\)/i }));

    // Persist lên glt_supplier_po_templates
    await waitFor(() => {
      expect(upsertSpy).toHaveBeenCalled();
    });

    // Toast xác nhận + SP auto-chọn vào đơn hôm nay (có input số lượng)
    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Đã thêm 1 SP vào template và đơn hôm nay'
      );
      expect(screen.getByText('Gạo B')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('1').length).toBe(2); // Gạo A + Gạo B
    });
  });

  it('non-admin không thấy nút Sửa template', async () => {
    useIsAdminMock.mockReturnValue({ isAdmin: false, loading: false });
    renderPage();
    await goToStep2();

    expect(
      screen.queryByRole('button', { name: /sửa template/i })
    ).not.toBeInTheDocument();
  });
});
