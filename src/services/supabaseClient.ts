import { createClient } from '@supabase/supabase-js';

// Get values directly from .env file or use defaults if not available
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.gaolamthuy.vn';
// Use the actual service key from .env instead of a default
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3NDMzNTQwMDAsCiAgImV4cCI6IDE5MDExMjA0MDAKfQ.Ovdk9UIxb4FNfRDD8a_gCoXINuNs2gE64LhlJ-KXVe8';

console.log('Supabase URL:', supabaseUrl);
console.log('Using Supabase service key (first 10 chars):', supabaseServiceKey.substring(0, 10) + '...');

export const supabase = createClient(supabaseUrl, supabaseServiceKey); 