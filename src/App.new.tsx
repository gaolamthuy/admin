/**
 * App Component
 * Main application entry point với React Router và TanStack Query
 *
 * @module App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/refine-ui/layout/layout';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ProductList } from '@/pages/products/ProductList';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

/**
 * App Component
 * Setup routing, providers, và global components
 */
function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes với Layout */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/show/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Product Show Page (TODO)</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Purchase Order List (TODO)</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Purchase Order Create (TODO)</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/show/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Purchase Order Show (TODO)</div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
