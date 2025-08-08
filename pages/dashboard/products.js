import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Typography,
  Table,
  Space,
  Button,
  Tag,
  Alert,
  Spin,
  Input,
  Modal,
  Radio,
  Card,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  PrinterOutlined,
  CopyOutlined,
  AppstoreOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { supabase } from '../../utils/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title } = Typography;

// Bỏ WEIGHTS array vì không còn cần thiết

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'card'

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) {
        setError('Supabase client is not initialized. Check your .env file and api.js.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('view_product')
          .select(`*`)
          .order('modified_date', { ascending: false });

        if (error) {
          throw error;
        }

        const uniqueCategories = [...new Set(data?.map((product) => product.category_name) || [])];
        setCategories(uniqueCategories);
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category_name === selectedCategory;
    const matchesSearch =
      !searchText ||
      product.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Bỏ handleWeightPrint vì không còn cần thiết

  const handleCopyChangelog = async (date) => {
    try {
      const formattedDate = dayjs(date).format('DD/MM/YYYY');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/changelog?date=${formattedDate}&output_type=plain`
      );
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      Modal.success({
        content: 'Đã sao chép vào clipboard',
      });
    } catch (error) {
      console.error('Error copying changelog:', error);
      Modal.error({
        content: 'Không thể sao chép changelog',
      });
    }
  };

  const columns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'full_name',
      key: 'full_name',
      width: '25%',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'modified_date',
      key: 'modified_date',
      width: '15%',
      render: (date) => {
        const isRecent = dayjs(date).isAfter(dayjs().subtract(3, 'day'));
        return (
          <Space>
            {dayjs(date).fromNow()}
            {isRecent && <Tag color="green">Mới cập nhật</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Giá bán',
      dataIndex: 'base_price',
      key: 'baseprice',
      width: '15%',
      render: (price) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(price || 0),
    },
    {
      title: 'In ấn',
      key: 'print',
      width: '20%',
      render: (_, record) => (
        <Button
          icon={<PrinterOutlined />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_WEBHOOK_API_URL}/webhook/print?printType=priceboard&productId=${record.kiotviet_id}`,
              '_blank'
            )
          }
        >
          In bảng giá bán lẻ
        </Button>
      ),
    },
  ];

  // Component hiển thị sản phẩm dạng card
  const ProductCard = ({ product }) => {
    const isRecent = dayjs(product.modified_date).isAfter(dayjs().subtract(3, 'day'));

    return (
      <Card
        hoverable
        style={{ height: '100%', position: 'relative' }}
        bodyStyle={{ paddingBottom: 8 }}
      >
        {/* Icon in ở góc phải */}
        <Button
          type="text"
          icon={<PrinterOutlined />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_WEBHOOK_API_URL}/webhook/print?printType=priceboard&productId=${product.kiotviet_id}`,
              '_blank'
            )
          }
          title="In bảng giá bán lẻ"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        />

        <Card.Meta
          title={
            <div style={{ paddingRight: 40 }}>
              <div>{product.full_name}</div>
              {isRecent && (
                <div style={{ marginTop: 4 }}>
                  <Tag color="green" size="small">
                    Mới cập nhật
                  </Tag>
                </div>
              )}
            </div>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <strong>Mô tả:</strong> {product.description || 'Không có mô tả'}
              </div>
              <div>
                <strong>Ngày cập nhật:</strong> {dayjs(product.modified_date).fromNow()}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(product.base_price || 0)}
                </span>
              </div>
            </Space>
          }
        />
      </Card>
    );
  };

  const ChangelogModal = ({ visible, data, onClose }) => (
    <Modal
      title={
        <Space>
          <span>Chi tiết thay đổi</span>
          {data && (
            <>
              <Button
                icon={<PrinterOutlined />}
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/changelog?date=${dayjs(
                      data.created_at
                    ).format('DD/MM/YYYY')}&output_type=html`,
                    '_blank'
                  )
                }
              >
                Xem báo cáo
              </Button>
              <Button icon={<CopyOutlined />} onClick={() => handleCopyChangelog(data.created_at)}>
                Sao chép
              </Button>
            </>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {data && (
        <Table
          dataSource={data.changes}
          columns={[
            {
              title: 'Trường',
              dataIndex: 'field',
              key: 'field',
            },
            {
              title: 'Giá trị cũ',
              dataIndex: 'old_value',
              key: 'old_value',
            },
            {
              title: 'Giá trị mới',
              dataIndex: 'new_value',
              key: 'new_value',
            },
          ]}
          pagination={false}
        />
      )}
    </Modal>
  );

  if (error) {
    return <Alert message="Error Loading Products" description={error} type="error" showIcon />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space direction="horizontal" align="center" style={{ width: '100%', marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý sản phẩm
        </Title>
        <Button
          type="default"
          icon={<PrinterOutlined />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/price-table/retail`,
              '_blank'
            )
          }
        >
          In bảng giá tổng
        </Button>
      </Space>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Radio.Group
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ marginBottom: 0 }}
          >
            <Radio.Button key="all" value="all">
              Tất cả danh mục
            </Radio.Button>
            {categories.map((category) => (
              <Radio.Button key={category} value={category}>
                {category}
              </Radio.Button>
            ))}
          </Radio.Group>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Space>
        <Space>
          <Button.Group>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
            >
              Bảng
            </Button>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
            >
              Card
            </Button>
          </Button.Group>
        </Space>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} sản phẩm`,
          }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredProducts.map((product) => (
            <Col key={product.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
};

ProductsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
