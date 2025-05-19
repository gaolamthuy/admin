import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space } from 'antd';
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  HistoryOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const getMenuItems = (isAdmin) => {
  const dashboardItems = [
    // {
    //   key: '/dashboard',
    //   icon: <DashboardOutlined />,
    //   label: 'In',
    // },
    {
      key: '/dashboard/customer',
      icon: <UserOutlined />,
      label: 'Khách hàng',
    },
    {
      key: '/dashboard/products',
      icon: <ShopOutlined />,
      label: 'Sản phẩm',
    },
    {
      key: '/dashboard/changelog',
      icon: <HistoryOutlined />,
      label: 'Nhật ký thay đổi giá',
    },
  ];

  // If admin, add a link back to admin panel
  if (isAdmin) {
    dashboardItems.unshift({
      key: '/admin/purchase-order',
      icon: <ShoppingCartOutlined />,
      label: 'Back to Admin',
    });
  }

  return dashboardItems;
};

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { logout, isAdmin } = useAuth();

  const currentRoute = router.pathname;
  const menuItems = getMenuItems(isAdmin);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? '0px' : '24px',
            color: '#001529',
          }}
        >
          <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          {!collapsed && (
            <Title
              level={4}
              style={{ color: '#001529', margin: '0 0 0 10px', whiteSpace: 'nowrap' }}
            >
              Dashboard
            </Title>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[currentRoute]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          {children}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dashboard ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
