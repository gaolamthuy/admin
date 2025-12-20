import { Authenticated, Refine, useInvalidate } from '@refinedev/core';
import { useEffect, useRef } from 'react';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import './App.css';
import authProvider from './authProvider';
import { ErrorComponent } from './components/refine-ui/layout/error-component';
import { Layout } from './components/refine-ui/layout/layout';
import { Toaster } from './components/refine-ui/notification/toaster';
import { useNotificationProvider } from './components/refine-ui/notification/use-notification-provider';
import { ThemeProvider } from './components/refine-ui/theme/theme-provider';
import { Login, Register, ForgotPassword } from './pages/auth';
import {
  ProductCreate,
  // ProductEdit, // Disabled - using inline editing in show page
  ProductList,
  ProductShow,
} from './pages/products';
import {
  PurchaseOrderCreate,
  PurchaseOrderEdit,
  PurchaseOrderList,
  PurchaseOrderShow,
} from './pages/purchase-orders';
import { TestList } from './pages/test/list';
import { supabaseClient } from './utility';
import {
  startSupabaseSessionWatcher,
  ensureSessionActive,
} from './lib/supabase-session';

function App() {
  useEffect(() => {
    const cleanup = startSupabaseSessionWatcher(supabaseClient);
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider(supabaseClient)}
              liveProvider={liveProvider(supabaseClient)}
              authProvider={authProvider}
              routerProvider={routerProvider}
              notificationProvider={useNotificationProvider()}
              resources={[
                {
                  name: 'kv_products',
                  list: '/products',
                  create: '/products/create',
                  edit: '/products/edit/:id',
                  show: '/products/show/:id',
                  meta: {
                    canDelete: true,
                    label: 'Sản phẩm',
                  },
                },
                {
                  name: 'kv_purchase_orders',
                  list: '/purchase-orders',
                  create: '/purchase-orders/create',
                  edit: '/purchase-orders/edit/:id',
                  show: '/purchase-orders/show/:id',
                  meta: {
                    canDelete: true,
                    label: 'Đơn mua hàng',
                  },
                },
                {
                  name: 'kv_customers',
                  list: '/test',
                  meta: {
                    label: 'Test Page',
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: '0TQsGT-boryWn-NNtkYx',
                liveMode: 'auto',
              }}
            >
              <VisibilityRefresh />
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-inner"
                      fallback={<CatchAllNavigate to="/auth/login" />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route
                    index
                    element={<NavigateToResource resource="kv_products" />}
                  />
                  <Route path="/products">
                    <Route index element={<ProductList />} />
                    <Route path="create" element={<ProductCreate />} />
                    {/* <Route path="edit/:id" element={<ProductEdit />} /> Disabled - using inline editing */}
                    <Route path="show/:id" element={<ProductShow />} />
                  </Route>
                  <Route path="/purchase-orders">
                    <Route index element={<PurchaseOrderList />} />
                    <Route path="create" element={<PurchaseOrderCreate />} />
                    <Route path="edit/:id" element={<PurchaseOrderEdit />} />
                    <Route path="show/:id" element={<PurchaseOrderShow />} />
                  </Route>
                  <Route path="/test" element={<TestList />} />
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-outer"
                      fallback={<Outlet />}
                    >
                      <NavigateToResource />
                    </Authenticated>
                  }
                >
                  <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route
                      path="forgot-password"
                      element={<ForgotPassword />}
                    />
                  </Route>
                </Route>
              </Routes>

              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;

/**
 * Component ẩn để:
 * - Lắng nghe sự kiện user quay lại tab (visibilitychange)
 * - Đảm bảo Supabase session còn hợp lệ và connection được restore
 * - Invalidate lại các resource dựa trên current route để Refine refetch data với đúng pagination state
 *
 * ⚠️ Quan trọng: Component này phải được render BÊN TRONG <Refine>
 * để có QueryClient / context đầy đủ cho useInvalidate.
 */
/**
 * Component ẩn để:
 * - Chỉ handle route changes để invalidate resource
 * - Component-level visibility handling đã được implement trong mỗi list component
 * - Đảm bảo Supabase session còn hợp lệ khi route change
 *
 * ⚠️ Quan trọng: Component này phải được render BÊN TRONG <Refine>
 * để có QueryClient / context đầy đủ cho useInvalidate.
 */
function VisibilityRefresh() {
  const invalidate = useInvalidate();
  const location = useLocation();
  const prevPathnameRef = useRef<string>(location.pathname);

  /**
   * Lấy resource name từ current pathname
   * @returns Resource name hoặc null
   */
  const getResourceFromPath = (pathname: string): string | null => {
    if (pathname.startsWith('/products')) {
      return 'kv_products';
    }
    if (pathname.startsWith('/purchase-orders')) {
      return 'kv_purchase_orders';
    }
    if (pathname.startsWith('/test')) {
      return 'kv_customers';
    }
    return null;
  };

  // Handle route change - chỉ invalidate khi pathname thực sự thay đổi
  // Component-level visibility handling đã được implement trong mỗi list component
  useEffect(() => {
    // Chỉ invalidate khi pathname thực sự thay đổi (không phải mỗi lần render)
    if (
      prevPathnameRef.current !== location.pathname &&
      document.visibilityState === 'visible'
    ) {
      prevPathnameRef.current = location.pathname;

      // Đảm bảo session Supabase active trước khi invalidate
      ensureSessionActive(supabaseClient)
        .then(() => {
          const currentResource = getResourceFromPath(location.pathname);
          if (currentResource) {
            invalidate({
              resource: currentResource,
              invalidates: ['all'],
            });
            console.log(
              `[visibility-refresh] Route changed, invalidated: ${currentResource}`
            );
          }
        })
        .catch(error => {
          console.warn('[visibility-refresh] Session check failed:', error);
        });
    }
  }, [location.pathname, invalidate]);

  return null;
}
