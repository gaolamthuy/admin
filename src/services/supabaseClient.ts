import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get values directly from .env file or use defaults if not available
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.gaolamthuy.vn';
// Use the actual service key from .env instead of a default
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3NDMzNTQwMDAsCiAgImV4cCI6IDE5MDExMjA0MDAKfQ.Ovdk9UIxb4FNfRDD8a_gCoXINuNs2gE64LhlJ-KXVe8';

console.log('Initializing Supabase client:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Using env vars:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('- Using service key (first 10 chars):', supabaseServiceKey.substring(0, 10) + '...');

// Create client with error handling
let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('Supabase client created successfully');
  
  // Test the connection
  supabase.auth.getSession()
    .then((response: any) => {
      console.log('Supabase connection test:', response.error ? 'Failed' : 'Successful');
      if (response.error) {
        console.error('Supabase connection error:', response.error);
      }
    })
    .catch((err: any) => {
      console.error('Failed to test Supabase connection:', err);
    });
    
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a mock client to prevent app crashes
  supabase = createClient(supabaseUrl, supabaseServiceKey) as SupabaseClient;
}

export { supabase }; 