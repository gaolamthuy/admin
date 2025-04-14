import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Table, Button, Space, Typography } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

interface Customer {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  contact_number: string;
  location_name: string;
  debt: number;
}

const CustomerSearch: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kiotviet_customers')
        .select('*')
        .limit(100);

      if (error) {
        throw error;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase.from('kiotviet_customers').select('*');

      if (searchText) {
        query = query.or(
          `name.ilike.%${searchText}%,code.ilike.%${searchText}%,contact_number.ilike.%${searchText}%`
        );
      }

      const { data, error } = await query.limit(100);

      if (error) {
        throw error;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'kiotviet_id',
      key: 'kiotviet_id',
      width: 100,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Phone',
      dataIndex: 'contact_number',
      key: 'contact_number',
      width: 150,
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 200,
    },
    {
      title: 'Debt',
      dataIndex: 'debt',
      key: 'debt',
      render: (debt: number) => `${debt?.toLocaleString() || 0} VND`,
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Customer) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => {
              navigate('/checkout', { state: { customer: record } });
            }}
          >
            Select
          </Button>
        </Space>
      ),
      width: 120,
    },
  ];

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
            defaultSelectedKeys={['2']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => navigate('/')}>
              Dashboard
            </Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />}>
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
            <Title level={2}>Customer Search</Title>
            
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search by name, code or phone"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Button type="primary" onClick={handleSearch} loading={loading}>
                Search
              </Button>
              <Button onClick={fetchCustomers}>Reset</Button>
            </Space>
            
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ y: 'calc(100vh - 300px)' }}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default CustomerSearch; 