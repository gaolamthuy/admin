"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

type AppHeaderProps = {
  roleLabel: string;
  userEmail: string | null | undefined;
  onSignOut: () => Promise<void> | void;
  title?: string;
  logoHref?: string;
};

export function AppHeader({
  roleLabel,
  userEmail,
  onSignOut,
  title = "Gạo Lâm Thúy",
  logoHref = "/",
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <a href={logoHref}>
          <div className="flex items-center space-x-3">
            <img
              src="https://raw.githubusercontent.com/gaolamthuy/logo/refs/heads/main/logo-main-hexagon-extrawhiteborder-forproductimage.svg"
              alt={title}
              className="h-14 w-14"
            />
            <div className="leading-tight">
              <div className="text-xl font-bold">{title}</div>
              <div className="text-sm text-muted-foreground">
                Portal <Badge variant="secondary">{roleLabel}</Badge>
              </div>
            </div>
          </div>
        </a>
        <div className="ml-auto flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="[&>svg]:!h-7 [&>svg]:!w-7"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={40} /> : <Moon size={40} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {(userEmail?.charAt(0) || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="px-3 py-2 text-sm text-muted-foreground border-b mb-1 space-y-1">
                <div className="font-medium text-foreground">{userEmail}</div>
                {roleLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {roleLabel}
                  </Badge>
                )}
              </div>
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
