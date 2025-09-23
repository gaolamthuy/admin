import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for auth + data (uses cookies/localStorage correctly)
export const createClientComponentClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const getCurrentUser = async () => {
  const supabase = createClientComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getUserRole = async (userId: string) => {
  const supabase = createClientComponentClient();
  const { data } = await supabase
    .from("glt_users")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role;
};
