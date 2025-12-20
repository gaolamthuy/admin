/**
 * Supabase client instance
 * Sử dụng Supabase JS client trực tiếp (không dùng Refine wrapper)
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client instance
 * Được cấu hình với:
 * - persistSession: true - Lưu session trong localStorage
 * - autoRefreshToken: true - Tự động refresh token
 * - detectSessionInUrl: true - Detect session từ URL (cho OAuth)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Export types
export type { User, Session } from '@supabase/supabase-js';
