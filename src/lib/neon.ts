/**
 * Neon client instance
 * Sử dụng Neon JS client với SupabaseAuthAdapter để tương thích API Supabase cũ
 *
 * @module lib/neon
 */

import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import { env } from '@/lib/env';

if (!env.VITE_NEON_AUTH_URL || !env.VITE_NEON_DATA_API_URL) {
  throw new Error('Missing Neon environment variables');
}

export const client = createClient({
  auth: {
    url: env.VITE_NEON_AUTH_URL,
    adapter: SupabaseAuthAdapter(),
  },
  dataApi: {
    url: env.VITE_NEON_DATA_API_URL,
  },
});
