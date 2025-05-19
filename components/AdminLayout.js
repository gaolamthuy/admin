import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button, Space, Drawer } from 'antd';
import {
  ShoppingCartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CrownOutlined,
  DashboardOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/admin/purchase-order',
    icon: <ShoppingCartOutlined />,
    label: 'Purchase Orders',
  },
  {
    key: '/admin/upload',
    icon: <UploadOutlined />,
    label: 'Upload Photos',
  },
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Go to Dashboard',
  },
];

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const router = useRouter();
  const { logout, isAdmin } = useAuth();

  const currentRoute = router.pathname;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setDrawerVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure only admin can access this layout
  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const SidebarContent = () => (
    <>
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? '0px' : '24px',
          color: 'white',
        }}
      >
        <CrownOutlined style={{ fontSize: '24px', color: '#ffd700' }} />
        {!collapsed && (
          <Title level={4} style={{ color: 'white', margin: '0 0 0 10px', whiteSpace: 'nowrap' }}>
            Admin Panel
          </Title>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentRoute]}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link href={item.key}>{item.label}</Link>,
        }))}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
          bodyStyle={{ padding: 0, background: '#001529' }}
          width={200}
        >
          <SidebarContent />
        </Drawer>
      ) : (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
          <SidebarContent />
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => (isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed))}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
              {!isMobile && 'Logout'}
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: isMobile ? '8px' : '24px 16px',
            padding: isMobile ? 0 : 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: isMobile ? 0 : 8,
          }}
        >
          {children}
        </Content>
        <Footer style={{ textAlign: 'center', padding: isMobile ? '12px' : '24px' }}>
          Admin Panel ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
