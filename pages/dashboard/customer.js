import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Typography, Table, Avatar, Space, Button, Tag, Alert, Spin, Input, AutoComplete } from 'antd';
import { UserOutlined, SearchOutlined, PrinterOutlined } from '@ant-design/icons';
import { supabase } from '../../utils/api'; // Import supabase client
import { NEXT_QUERY_PARAM_PREFIX } from 'next/dist/lib/constants';

const { Title, Paragraph } = Typography;

// Adjusted columns - make sure dataIndex matches your Supabase table columns
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Contact',
    dataIndex: 'contact_number',
    key: 'contact_number',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <Button 
          icon={<PrinterOutlined />}
          onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/price-table/${record.kiotviet_id}`, '_blank')}
        >
          Bảng giá
        </Button>

      </Space>
    ),
  },
];

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Normalize Vietnamese text for search
  const normalizeText = (text) => {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Generate search options based on current data
  const getSearchOptions = (inputValue) => {
    const normalizedInput = normalizeText(inputValue);
    return customers
      .filter(customer => {
        const searchableFields = [
          customer.name,
          customer.code,
          customer.contact_number,
          customer.address
        ].map(field => field ? normalizeText(field.toString()) : '');
        
        return searchableFields.some(field => field.includes(normalizedInput));
      })
      .sort((a, b) => (b.search_priority || 0) - (a.search_priority || 0))
      .slice(0, 10)
      .map(customer => ({
        value: customer.name,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{customer.name}</span>
            <span style={{ color: '#666' }}>{customer.contact_number}</span>
          </div>
        ),
        customer
      }));
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!supabase) {
        setError('Supabase client is not initialized. Check your .env file and api.js.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const { data, error: supabaseError } = await supabase
          .from('kv_customers')
          .select('*')
          .neq('groups', '')
          .order('search_priority', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }
        setCustomers(data || []);
        setFilteredCustomers(data || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err.message || 'Failed to fetch customers.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle search
  const onSearch = (value) => {
    if (!value) {
      setFilteredCustomers(customers);
      return;
    }

    const normalizedSearch = normalizeText(value);
    const filtered = customers.filter(customer => {
      const searchableFields = [
        customer.name,
        customer.code,
        customer.contact_number,
        customer.address
      ].map(field => field ? normalizeText(field.toString()) : '');
      
      return searchableFields.some(field => field.includes(normalizedSearch));
    });

    setFilteredCustomers(filtered);
  };

  if (error) {
    return <Alert message="Error Loading Customers" description={error} type="error" showIcon />;
  }

  return (
    <Space direction="vertical" size="large" style={{width: '100%'}}>
      <Title level={3}>Quản lý khách hàng</Title>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <AutoComplete
          style={{ width: 400 }}
          options={getSearchOptions(searchText)}
          onSearch={(text) => {
            setSearchText(text);
            onSearch(text);
          }}
          onSelect={(value, option) => {
            setFilteredCustomers([option.customer]);
          }}
        >
          <Input
            size="large"
            placeholder="Tìm kiếm theo tên, mã, số điện thoại..."
            prefix={<SearchOutlined />}
          />
        </AutoComplete>
      </Space>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} khách hàng`,
          }}
        />
      )}
    </Space>
  );
};

CustomerPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default CustomerPage; 