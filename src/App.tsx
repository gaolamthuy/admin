import { Authenticated, Refine } from '@refinedev/core';
import { useEffect } from 'react';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
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
import { supabaseClient } from './utility';
import { startSupabaseSessionWatcher } from './lib/supabase-session';

function App() {
  useEffect(() => {
    const cleanup = startSupabaseSessionWatcher(supabaseClient);
    return cleanup;
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
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: '0TQsGT-boryWn-NNtkYx',
                liveMode: 'auto',
              }}
            >
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
