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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useIsAdmin } from '@/hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Download,
  Users,
  DollarSign,
  ClipboardList,
  Settings,
  LifeBuoy,
  MessageSquare,
  Banknote,
  ChevronDown,
} from 'lucide-react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
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
    icon: Download,
    path: '/purchase-orders',
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: DollarSign,
    path: '/payments',
  },
  {
    key: 'customers',
    label: 'Khách hàng',
    icon: Users,
    path: '/customers',
  },
  {
    key: 'invoices',
    label: 'Hóa đơn',
    icon: ClipboardList,
    path: '/invoices',
  },
  {
    key: 'misc',
    label: 'Hỗ trợ',
    icon: LifeBuoy,
    children: [
      {
        key: 'misc-zalo',
        label: 'Gửi bảng giá Zalo',
        icon: MessageSquare,
        path: '/misc/zalo',
      },
      {
        key: 'misc-cash-count',
        label: 'Kiểm đếm tiền mặt',
        icon: Banknote,
        path: '/misc/cash-count',
      },
    ],
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
                className="size-8 shrink-0 rounded-lg object-cover group-data-[collapsible=icon]:size-8"
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
                const isActive = item.path
                  ? location.pathname.startsWith(item.path)
                  : (item.children ?? []).some(child =>
                      location.pathname.startsWith(child.path ?? '')
                    );

                if (item.children?.length) {
                  return (
                    <Collapsible
                      key={item.key}
                      defaultOpen={isActive}
                      className="group/collapsible-menu"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label}>
                            <Icon />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible-menu:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map(child => {
                              const childActive = child.path
                                ? location.pathname.startsWith(child.path)
                                : false;
                              return (
                                <SidebarMenuSubItem key={child.key}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childActive}
                                  >
                                    <Link to={child.path ?? '/'}>
                                      <span>{child.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => item.path && navigate(item.path)}
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
    </Sidebar>
  );
}
