import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Typography,
  Calendar,
  Badge,
  Space,
  Alert,
  Spin,
  Modal,
  Table,
  Button,
  message,
  Card,
  Row,
  Col,
  Tag,
} from 'antd';
import { supabase } from '../../utils/api';
import {
  CopyOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ChangelogPage = () => {
  const [changelogs, setChangelogs] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState([]);
  const [plainChangelog, setPlainChangelog] = useState('');
  const [loadingPlain, setLoadingPlain] = useState(false);
  const [viewMode, setViewMode] = useState('latest'); // 'latest' hoặc 'calendar'

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setError('Supabase client is not initialized. Check your .env file and api.js.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Fetch changelogs
        const { data: changelogData, error: changelogError } = await supabase
          .from('glt_product_changelogs')
          .select('*')
          .order('created_at', { ascending: false });

        if (changelogError) throw changelogError;

        // Get unique kiotviet_ids from changelogs
        const kiotvietIds = [...new Set(changelogData.map((log) => log.kiotviet_id))];

        // Fetch related products
        const { data: productData, error: productError } = await supabase
          .from('kv_products')
          .select('kiotviet_id, full_name, code')
          .in('kiotviet_id', kiotvietIds);

        if (productError) throw productError;

        // Create products lookup object
        const productsLookup = productData.reduce((acc, product) => {
          acc[product.kiotviet_id] = product;
          return acc;
        }, {});

        setProducts(productsLookup);
        setChangelogs(changelogData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dateCellRender = (value) => {
    const date = value.format('YYYY-MM-DD');
    const dayChanges = changelogs.filter((log) => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      return logDate === date;
    });

    if (dayChanges.length === 0) return null;

    return (
      <div className="changelog-cell">
        <Badge
          count={dayChanges.length}
          style={{
            backgroundColor: '#1890ff',
            marginTop: '4px',
          }}
        />
      </div>
    );
  };

  const onSelect = (date) => {
    const selectedDateStr = date.format('YYYY-MM-DD');
    const changes = changelogs.filter((log) => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      return logDate === selectedDateStr;
    });

    if (changes.length > 0) {
      setSelectedChanges(changes);
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  // Map field names to Vietnamese
  const fieldMap = {
    name: 'Tên',
    price: 'Giá',
    code: 'Mã',
    category_name: 'Danh mục',
    description: 'Mô tả',
    // Add more field mappings as needed
  };

  // Get field color based on type
  const getFieldColor = (field) => {
    switch (field) {
      case 'price':
        return 'red';
      case 'name':
        return 'orange';
      case 'description':
        return 'green';
      default:
        return 'blue';
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => {
        const product = products[record.kiotviet_id] || {};
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{product.full_name || 'Unknown Product'}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Trường',
      dataIndex: 'field',
      key: 'field',
      render: (text) => {
        return <Tag color={getFieldColor(text)}>{fieldMap[text] || text}</Tag>;
      },
    },
    {
      title: 'Giá trị cũ',
      dataIndex: 'old_value',
      key: 'old_value',
      render: (text) => text || '-',
    },
    {
      title: 'Giá trị mới',
      dataIndex: 'new_value',
      key: 'new_value',
      render: (text) => text || '-',
    },
  ];

  // Component hiển thị latest changelog
  const LatestChangelogView = () => {
    // Group changes by date
    const groupedChanges = changelogs.reduce((acc, change) => {
      const date = new Date(change.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(change);
      return acc;
    }, {});

    // Sort dates descending
    const sortedDates = Object.keys(groupedChanges).sort((a, b) => new Date(b) - new Date(a));

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {sortedDates.map((date) => {
          const changes = groupedChanges[date];
          const product = products[changes[0]?.kiotviet_id] || {};

          return (
            <Card
              key={date}
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>{dayjs(date).format('DD/MM/YYYY')}</span>
                  <Tag color="blue">{changes.length} thay đổi</Tag>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="text"
                    icon={<PrinterOutlined />}
                    onClick={() => {
                      window.open(
                        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/changelog?date=${dayjs(
                          date
                        ).format('DD/MM/YYYY')}`,
                        '_blank'
                      );
                    }}
                    title="In nhật ký"
                  />
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={async () => {
                      setLoadingPlain(true);
                      try {
                        const dateStr = dayjs(date).format('DD/MM/YYYY');
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/changelog?date=${dateStr}&output_type=plain`
                        );
                        const text = await res.text();
                        await navigator.clipboard.writeText(text);
                        message.success('Đã copy nhật ký!');
                      } catch (err) {
                        message.error('Copy thất bại!');
                      } finally {
                        setLoadingPlain(false);
                      }
                    }}
                    loading={loadingPlain}
                    title="Copy nhật ký"
                  />
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={changes}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          );
        })}
      </Space>
    );
  };

  if (error) {
    return <Alert message="Error Loading Changelog" description={error} type="error" showIcon />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          Nhật ký thay đổi sản phẩm
        </Title>

        <Space>
          <Button
            type={viewMode === 'latest' ? 'primary' : 'default'}
            icon={<ClockCircleOutlined />}
            onClick={() => setViewMode('latest')}
          >
            Mới nhất
          </Button>
          <Button
            type={viewMode === 'calendar' ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={() => setViewMode('calendar')}
          >
            Lịch
          </Button>
        </Space>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : viewMode === 'latest' ? (
        <LatestChangelogView />
      ) : (
        <>
          <Calendar
            dateCellRender={dateCellRender}
            onSelect={onSelect}
            style={{
              background: 'white',
              padding: '24px',
            }}
          />

          <Modal
            title={`Thay đổi ngày ${selectedDate?.format('DD/MM/YYYY')}`}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={900}
          >
            <Button
              type="primary"
              style={{ marginBottom: 16 }}
              onClick={() => {
                window.open(
                  `${
                    process.env.NEXT_PUBLIC_BACKEND_API_URL
                  }/print/changelog?date=${selectedDate?.format('DD/MM/YYYY')}`,
                  '_blank'
                );
              }}
            >
              In nhật ký
            </Button>
            <Button
              type="dashed"
              icon={<CopyOutlined />}
              style={{ marginBottom: 16, marginLeft: 8 }}
              loading={loadingPlain}
              onClick={async () => {
                if (!selectedDate) return;
                setLoadingPlain(true);
                try {
                  const dateStr = selectedDate.format('DD/MM/YYYY');
                  const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/changelog?date=${dateStr}&output_type=plain`
                  );
                  const text = await res.text();
                  await navigator.clipboard.writeText(text);
                  message.success('Đã copy nhật ký!');
                } catch (err) {
                  message.error('Copy thất bại!');
                } finally {
                  setLoadingPlain(false);
                }
              }}
            >
              Copy nhật ký
            </Button>
            <Table
              columns={columns}
              dataSource={selectedChanges}
              rowKey="id"
              pagination={{
                pageSize: 10,
              }}
              scroll={{ x: 1000 }}
              style={{ marginTop: 16 }}
            />
          </Modal>
        </>
      )}

      <style jsx global>{`
        .changelog-cell {
          text-align: center;
          padding: 4px;
        }
        .ant-picker-calendar-date-content {
          height: 40px !important;
        }
      `}</style>
    </Space>
  );
};

ChangelogPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ChangelogPage;
