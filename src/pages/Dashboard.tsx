import React from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Button } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  ShoppingCartOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ height: '100vh' }}>
      <Header className="header">
        <div style={{ color: 'white', fontSize: '1.5rem' }}>
          Gao Lam Thuy POS
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.Item key="1" icon={<DashboardOutlined />}>
              Dashboard
            </Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />} onClick={() => navigate('/customers')}>
              Customers
            </Menu.Item>
            <Menu.Item key="3" icon={<ShoppingCartOutlined />} onClick={() => navigate('/checkout')}>
              Checkout
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <h1>Dashboard</h1>
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Customers"
                    value={1200}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Recent Sales"
                    value={15000}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CreditCardOutlined />}
                    suffix="VND"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Invoices Today"
                    value={8}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 32 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Button
                    type="primary"
                    icon={<UserOutlined />}
                    size="large"
                    block
                    onClick={() => navigate('/customers')}
                  >
                    Customer Search
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    size="large"
                    block
                    onClick={() => navigate('/checkout')}
                  >
                    New Sale
                  </Button>
                </Col>
              </Row>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Dashboard; 