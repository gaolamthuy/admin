import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks for development
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://supabase.gaolamthuy.vn";
const supabaseServiceKey =
  process.env.REACT_APP_SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzQzMzU0MDAwLAogICJleHAiOiAxOTAxMTIwNDAwCn0.ecjnK9CA0eQPLPcRPRIo5iuyVrU4fkMTs8th5_swpwE";

// Log if we're using fallbacks
if (
  !process.env.REACT_APP_SUPABASE_URL ||
  !process.env.REACT_APP_SUPABASE_SERVICE_KEY
) {
  console.warn(
    "Using fallback Supabase credentials. This should only happen in development."
  );
  console.warn("Please make sure your .env file is properly configured.");
}

// Create client with error handling
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Supabase client created successfully");

  // Test the connection immediately
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("kv_products")
        .select("id")
        .limit(1);
      if (error) throw error;
      console.log("Supabase connection test: Successful");
    } catch (err) {
      console.error("Supabase connection test failed:", err);
      throw err;
    }
  };

  // Run the test but don't block initialization
  testConnection().catch((err) => {
    console.error("Failed to connect to Supabase:", err);
  });
} catch (error) {
  console.error("Failed to create Supabase client:", error);
  throw error; // Re-throw to prevent app from running with invalid Supabase client
}

export { supabase };
