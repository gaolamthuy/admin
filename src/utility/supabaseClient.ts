import { createClient } from '@refinedev/supabase';
import { env } from '@/lib/env';

/**
 * Supabase client instance
 * Uses validated environment variables for type safety
 */
export const supabaseClient = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
    },
  }
);
