'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useIsAdmin } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    key: 'products',
    label: 'Sản phẩm',
    icon: Package,
    path: '/products',
  },
  {
    key: 'purchase-orders',
    label: 'Nhập hàng',
    icon: ShoppingCart,
    path: '/purchase-orders',
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: CreditCard,
    path: '/payments',
  },
  {
    key: 'customers',
    label: 'Khách hàng',
    icon: Users,
    path: '/customers',
  },
];

export function AppSidebar() {
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || isAdmin
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate('/')}>
              <img
                src="/android-chrome-512x512.png"
                alt="Gao Lam Thuy"
                className="size-12 rounded-lg object-cover"
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Gao Lam Thuy</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => navigate(item.path)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cài đặt">
              <Settings />
              <span>Cài đặt</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
