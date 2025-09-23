"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Printer,
  FileText,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/AppHeader";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href.endsWith("/*")) {
      const base = href.replace("/*", "");
      return pathname.startsWith(base);
    }
    return pathname === href;
  };

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

      // Check if user has staff role
      const { data: userRole } = await supabase
        .from("glt_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRole?.role !== "staff") {
        toast.error("Không có quyền truy cập staff");
        router.push("/auth/signin");
        return;
      }

      setUser(user);
      setRole(userRole?.role ?? "");
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
        roleLabel={role || "Staff"}
        userEmail={user?.email}
        onSignOut={handleSignOut}
        title="Gạo Lâm Thúy"
        logoHref="/"
      />

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2 h-full">
            <Button
              variant={isActive("/staff/dashboard") ? "secondary" : "ghost"}
              className={`w-full justify-start pl-3 text-[1.125rem] leading-6 ${
                isActive("/staff/dashboard")
                  ? "border-l-2 border-primary bg-primary/10 text-primary"
                  : ""
              }`}
              onClick={() => router.push("/staff/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Trang chính
            </Button>

            {/* Print Menu */}
            <div className="space-y-1">
              <div
                className={`flex items-center px-3 py-1 pl-3 text-xs tracking-wide uppercase ${
                  isActive("/staff/print/*")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Printer className="mr-2 h-3 w-3" />
                In tem nhãn
              </div>
              <Button
                variant={
                  isActive("/staff/print/label-retail") ? "secondary" : "ghost"
                }
                className={`w-full justify-start pl-6 pr-2 py-2 rounded-md font-medium text-[1.05rem] ${
                  isActive("/staff/print/label-retail")
                    ? "bg-primary/10 text-primary"
                    : ""
                }`}
                onClick={() => router.push("/staff/print/label-retail")}
              >
                <FileText className="mr-3 ml-1 h-4 w-4 opacity-90" />
                Bán lẻ
                <span className="ml-auto text-xl">✨</span>
              </Button>
              <Button
                variant={
                  isActive("/staff/print/label-purchase-order")
                    ? "secondary"
                    : "ghost"
                }
                className={`w-full justify-start pl-6 pr-2 py-2 rounded-md text-[1.05rem] ${
                  isActive("/staff/print/label-purchase-order")
                    ? "bg-primary/10 text-primary"
                    : ""
                }`}
                onClick={() => router.push("/staff/print/label-purchase-order")}
              >
                <FileText className="mr-3 ml-1 h-4 w-4 opacity-90" />
                Nhập hàng
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
