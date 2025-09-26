"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClientComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      // Check if user has admin role
      const { data: userRole } = await supabase
        .from("glt_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRole?.role !== "admin") {
        toast.error("Không có quyền truy cập admin");
        router.push("/auth/signin");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
    toast.success("Đã đăng xuất");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        roleLabel={"Admin"}
        userEmail={user?.email}
        onSignOut={handleSignOut}
        title="Gạo Lâm Thúy"
        logoHref="/admin/dashboard"
      />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <nav className="p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/products")}
            >
              <Package className="mr-2 h-4 w-4" />
              Sản phẩm
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
