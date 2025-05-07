import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get environment variables with proper validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("ERROR: Missing required Supabase environment variables");
  console.error("Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_KEY in your .env file");
  throw new Error("Supabase configuration missing. Check console for details.");
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
