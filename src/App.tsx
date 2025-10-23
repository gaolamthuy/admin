/**
 * Main App component với Refine setup
 * Component chính của ứng dụng với cấu hình Refine
 */
// import React from "react";
import { Refine, Authenticated } from "@refinedev/core";
import {
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
  ErrorComponent,
} from "@refinedev/antd";
import {
  ShopOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { App as AntdApp, ConfigProvider } from "antd";
import { theme } from "antd";
import "@refinedev/antd/dist/reset.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import routerProvider from "@refinedev/react-router";
import { dataProvider } from "@refinedev/supabase";
import { authProvider } from "./providers/authProvider";
import { supabase } from "./lib/supabase";
import {
  ProductList,
  ProductCreate,
  ProductEdit,
  ProductShow,
} from "./pages/products";
import {
  CustomerList,
  CustomerCreate,
  CustomerEdit,
  CustomerShow,
} from "./pages/customers";
import {
  InvoiceList,
  InvoiceCreate,
  InvoiceEdit,
  InvoiceShow,
} from "./pages/invoices";
import { Login } from "./pages/auth/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { Header } from "./components/layout/Header";
import { Title } from "./components/layout/Title";

/**
 * App Content with Theme
 * Component nội dung app với theme configuration
 */
const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#f5a31c", // GLT Brand Color
          colorLink: "#f5a31c", // Link color
          colorLinkHover: "#d48a0a", // Link hover color
          colorLinkActive: "#b8750a", // Link active color
        },
        components: {
          Button: {
            colorPrimary: "#f5a31c",
            colorPrimaryHover: "#d48a0a",
            colorPrimaryActive: "#b8750a",
            algorithm: true, // Enable algorithm for proper color variations
          },
          Menu: {
            colorPrimary: "#f5a31c",
          },
          Pagination: {
            colorPrimary: "#f5a31c",
          },
          List: {
            colorPrimary: "#f5a31c",
          },
        },
      }}
    >
      <AntdApp>
        <Refine
          // Data provider cho Supabase
          dataProvider={dataProvider(supabase)}
          // Auth provider cho Supabase Auth
          authProvider={authProvider}
          // Notification provider
          notificationProvider={useNotificationProvider}
          // Router provider
          routerProvider={routerProvider}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
          // Resources configuration
          resources={[
            {
              name: "kv_products",
              list: "/products",
              create: "/products/create",
              edit: "/products/edit/:id",
              show: "/products/show/:id",
              meta: {
                label: "Sản phẩm",
                icon: <ShopOutlined />,
                canDelete: true,
              },
            },
            {
              name: "kv_customers",
              list: "/customers",
              create: "/customers/create",
              edit: "/customers/edit/:id",
              show: "/customers/show/:id",
              meta: {
                label: "Khách hàng",
                icon: <UserOutlined />,
                canDelete: true,
              },
            },
            {
              name: "kv_invoices",
              list: "/invoices",
              create: "/invoices/create",
              edit: "/invoices/edit/:id",
              show: "/invoices/show/:id",
              meta: {
                label: "Hóa đơn",
                icon: <FileTextOutlined />,
                canDelete: true,
              },
            },
          ]}
          // Layout configuration - using manual layout in routes
          // Error component - handled in routes
          // Dashboard - handled in routes
        >
          <Routes>
            <Route
              element={
                <Authenticated
                  key="authenticated"
                  fallback={<Navigate to="/login" />}
                >
                  <Outlet />
                </Authenticated>
              }
            >
              <Route
                element={
                  <ThemedLayout
                    Header={() => <Header />}
                    Sider={(props) => <ThemedSider {...props} fixed />}
                    Title={() => <Title />}
                  >
                    <Outlet />
                  </ThemedLayout>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="/products" element={<Outlet />}>
                  <Route index element={<ProductList />} />
                  <Route path="create" element={<ProductCreate />} />
                  <Route path="edit/:id" element={<ProductEdit />} />
                  <Route path="show/:id" element={<ProductShow />} />
                </Route>
                <Route path="/customers" element={<Outlet />}>
                  <Route index element={<CustomerList />} />
                  <Route path="create" element={<CustomerCreate />} />
                  <Route path="edit/:id" element={<CustomerEdit />} />
                  <Route path="show/:id" element={<CustomerShow />} />
                </Route>
                <Route path="/invoices" element={<Outlet />}>
                  <Route index element={<InvoiceList />} />
                  <Route path="create" element={<InvoiceCreate />} />
                  <Route path="edit/:id" element={<InvoiceEdit />} />
                  <Route path="show/:id" element={<InvoiceShow />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Route>
            <Route path="/login" element={<Login />} />
          </Routes>
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
};

/**
 * Main App component
 * Component chính với cấu hình Refine, Ant Design và Supabase
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
