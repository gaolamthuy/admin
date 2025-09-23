"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Nếu đã có session, tự động chuyển hướng theo role
  useEffect(() => {
    const supabase = createClientComponentClient();
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userRole } = await supabase
        .from("glt_users")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (userRole?.role === "admin") {
        window.location.assign("/admin/dashboard");
        return;
      }
      if (userRole?.role === "staff") {
        window.location.assign("/staff/dashboard");
        return;
      }
    };
    void checkSession();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Xử lý các loại lỗi khác nhau
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Email chưa được xác thực. Vui lòng kiểm tra hộp thư.");
        } else if (error.message.includes("Too many requests")) {
          toast.error("Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.");
        } else {
          toast.error("Đăng nhập thất bại: " + error.message);
        }
        return;
      }

      // Get user role
      const { data: userRole } = await supabase
        .from("glt_users")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (!userRole) {
        toast.error(
          "Không tìm thấy quyền hạn của người dùng. Vui lòng liên hệ quản trị viên."
        );
        return;
      }

      // Redirect based on role
      if (userRole.role === "admin") {
        window.location.assign("/admin/dashboard");
      } else if (userRole.role === "staff") {
        window.location.assign("/staff/dashboard");
      } else {
        toast.error("Không có quyền truy cập. Vui lòng liên hệ quản trị viên.");
      }

      toast.success("Đăng nhập thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để truy cập portal nội bộ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
          <div className="text-center">
            <Button variant="link" asChild className="text-sm">
              <Link href="/auth/forgot-password">Quên mật khẩu?</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
