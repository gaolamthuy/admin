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
  Select,
  Input,
  Modal,
  Radio,
} from 'antd';
import { SearchOutlined, PrinterOutlined, CopyOutlined } from '@ant-design/icons';
import { supabase } from '../../utils/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title } = Typography;

const WEIGHTS = [
  { label: '5kg', value: '5' },
  { label: '10kg', value: '10' },
  // Bạn muốn thêm loại nào thì thêm ở đây
];

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');

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
        const { data, error } = await supabase.from('view_product').select(`*`);

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

  const handleWeightPrint = (record, weight) => {
    window.open(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/label-product?code=${
        record.code
      }&quantity=${weight || 1}`,
      '_blank'
    );
  };

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
        <Space>
          <Select
            style={{ width: 120 }}
            placeholder="Chọn tem"
            onChange={(value) => handleWeightPrint(record, value)}
            options={WEIGHTS}
            dropdownStyle={{ minWidth: '120px' }}
          />

          <Button
            icon={<PrinterOutlined />}
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/print/price-board?kiotviet_product_id=${record.kiotviet_id}`,
                '_blank'
              )
            }
          >
            In bảng giá bán lẻ
          </Button>
        </Space>
      ),
    },
  ];

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
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
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
      )}
    </Space>
  );
};

ProductsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
