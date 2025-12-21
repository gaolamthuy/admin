/**
 * Sidebar Component
 * Sử dụng hooks mới từ useAuth
 *
 * @module components/app-layout/layout/sidebar
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarRail as ShadcnSidebarRail,
  SidebarTrigger,
  useSidebar as useShadcnSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, Home } from 'lucide-react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    key: 'products',
    label: 'Sản phẩm',
    icon: <Package className="h-4 w-4" />,
    path: '/products',
  },
  {
    key: 'purchase-orders',
    label: 'Đơn mua hàng',
    icon: <ShoppingCart className="h-4 w-4" />,
    path: '/purchase-orders',
    adminOnly: true,
  },
];

export function Sidebar() {
  const { open } = useShadcnSidebar();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || isAdmin
  );

  return (
    <ShadcnSidebar
      collapsible="icon"
      className={cn(
        'border-r',
        'border-sidebar-border',
        'bg-sidebar',
        'text-sidebar-foreground'
      )}
    >
      <ShadcnSidebarRail />
      <ShadcnSidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center gap-2 flex-1">
            <Home className="h-5 w-5 text-sidebar-foreground" />
            {open && (
              <span className="font-semibold text-sidebar-foreground">
                Admin Tool
              </span>
            )}
          </div>
          <SidebarTrigger className="ml-auto" />
        </div>
      </ShadcnSidebarHeader>
      <ShadcnSidebarContent
        className={cn(
          'transition-discrete',
          'duration-200',
          'flex',
          'flex-col',
          'gap-2',
          'pt-2',
          'pb-2',
          {
            'px-3': open,
            'px-1': !open,
          }
        )}
      >
        {filteredMenuItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Button
              key={item.key}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full',
                'justify-start',
                'gap-2',
                !open && 'px-2',
                !isActive &&
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {open && <span>{item.label}</span>}
            </Button>
          );
        })}
      </ShadcnSidebarContent>
    </ShadcnSidebar>
  );
}
