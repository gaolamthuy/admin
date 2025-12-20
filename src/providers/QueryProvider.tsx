/**
 * TanStack Query Provider
 * Cung cấp QueryClient cho toàn bộ ứng dụng
 *
 * @module providers/QueryProvider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

/**
 * QueryClient configuration
 * - staleTime: 5 phút - Data được coi là fresh trong 5 phút
 * - refetchOnWindowFocus: true - Tự động refetch khi window focus (tránh stale data bugs)
 * - retry: 1 - Retry 1 lần khi query fail
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider component
 * Wrap toàn bộ app với TanStack Query
 *
 * @param children - React children
 * @returns QueryClientProvider với ReactQueryDevtools
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
