import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Typography,
  Table,
  Space,
  Button,
  Tag,
  Alert,
  Spin,
  Modal,
  Input,
  Popover,
  Descriptions,
  message,
  Tooltip,
  Upload,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  ClearOutlined,
  SearchOutlined,
  UploadOutlined,
  SendOutlined,
  EditOutlined,
  UndoOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { supabase } from '../../utils/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import axios from 'axios';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;
const { TextArea } = Input;

const PurchaseOrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [descriptions, setDescriptions] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [originalDescription, setOriginalDescription] = useState('');
  const [editingDescriptions, setEditingDescriptions] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [debouncedProductFilter, setDebouncedProductFilter] = useState('');
  const [quickFilterProduct, setQuickFilterProduct] = useState('');

  // Debounce product filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductFilter(productFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [productFilter]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('view_purchase_orders')
          .select('*')
          .eq('glt_status', 'pending')
          .order('purchase_date', { ascending: false });

        if (supabaseError) throw supabaseError;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDescriptionChange = (id, value) => {
    setDescriptions((prev) => ({
      ...prev,
      [id]: value,
    }));
    setEditingDescriptions((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const clearDescription = (id) => {
    setDescriptions((prev) => ({
      ...prev,
      [id]: '',
    }));
  };

  // Filter orders by product name
  const filteredOrders = orders.filter((order) => {
    // Ưu tiên quick filter trước, sau đó mới đến debounced filter
    const activeFilter = quickFilterProduct || debouncedProductFilter;
    if (!activeFilter) return true;
    return order.product_name?.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      //   style: 'currency',
      //   currency: 'VND',
      //   currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleAction = async (record, action) => {
    try {
      setActionLoading(true);

      if (action === 'skip') {
        // Nếu vẫn cần skip, bạn giữ lại logic này hoặc xoá nếu không cần
        const { error } = await supabase
          .from('kv_purchase_order_details')
          .update({ glt_status: 'skipped' })
          .eq('id', record.id);

        if (error) throw error;

        setOrders((prev) => prev.filter((order) => order.id !== record.id));
        message.success('Order marked as skipped');
      } else {
        // Gửi payload lên webhook API
        const payload = {
          purchase_order_detail_id: record.id,
          status: 'done',
        };

        // Sử dụng webhook API URL
        const apiUrl = `${process.env.NEXT_PUBLIC_WEBHOOK_API_URL}/webhook/process-kv-purchase-order`;

        // Encode Basic Auth
        const username = process.env.NEXT_PUBLIC_WEBHOOK_USERNAME;
        const password = process.env.NEXT_PUBLIC_WEBHOOK_PASSWORD;
        const basicAuth = btoa(`${username}:${password}`);

        console.log('Processing purchase order:', {
          apiUrl,
          payload,
          username: username ? '***' : 'undefined',
        });

        const res = await axios.post(apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        });

        console.log('Webhook response:', {
          status: res.status,
          data: res.data,
        });

        if (res.status === 200) {
          // Thành công: xoá khỏi danh sách chờ xử lý
          setOrders((prev) => prev.filter((order) => order.id !== record.id));
          message.success('Đã xử lý đơn thành công!');
        } else {
          throw new Error(`Webhook trả về status ${res.status}`);
        }
      }
    } catch (err) {
      console.error('Error updating order:', err);
      message.error(err.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoteSubmit = async () => {
    try {
      const { error } = await supabase
        .from('kv_purchase_order_details')
        .update({ glt_admin_note: noteText })
        .eq('id', editingNote.id);

      if (error) throw error;

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === editingNote.id ? { ...order, glt_admin_note: noteText } : order
        )
      );

      message.success('Note updated successfully');
      setNoteModalVisible(false);
      setEditingNote(null);
      setNoteText('');
    } catch (error) {
      console.error('Error updating note:', error);
      message.error('Failed to update note');
    }
  };

  const columns = [
    {
      title: 'Ngày đặt',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (text) => dayjs(text).fromNow(),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          <Tooltip title="Filter nhanh theo sản phẩm này">
            <FilterOutlined
              style={{
                color: quickFilterProduct === text ? '#1890ff' : '#d9d9d9',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              onClick={() => {
                if (quickFilterProduct === text) {
                  // Nếu đang filter theo sản phẩm này thì clear filter
                  setQuickFilterProduct('');
                  setProductFilter('');
                  setDebouncedProductFilter('');
                } else {
                  // Nếu chưa filter thì set filter theo sản phẩm này
                  setQuickFilterProduct(text);
                  setProductFilter(text);
                  setDebouncedProductFilter(text);
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Ghi chú mới',
      key: 'new_description',
      render: (_, record) => {
        const value = descriptions[record.id] || '';
        const showCopy = !value && record.description;

        return (
          <Input
            allowClear
            placeholder={record.description || 'N/A'}
            value={value}
            onChange={(e) => handleDescriptionChange(record.id, e.target.value)}
            style={{ minWidth: 200 }}
            suffix={
              showCopy ? (
                <Tooltip title="Copy mô tả vào ghi chú mới">
                  <CopyOutlined
                    style={{ color: '#999', cursor: 'pointer' }}
                    onClick={async () => {
                      handleDescriptionChange(record.id, record.description || '');
                      if (record.description) {
                        await navigator.clipboard.writeText(record.description);
                      }
                    }}
                  />
                </Tooltip>
              ) : null
            }
          />
        );
      },
    },
    {
      title: 'Chênh lệch',
      key: 'cost_difference',
      render: (_, record) => (
        <Space>
          <Popover
            trigger="hover" // <-- chỉ hiện khi hover vào value
            overlayInnerStyle={{
              borderRadius: 16,
              background: '#f9fafb',
              minWidth: 340,
              padding: 20,
            }}
            title={<span style={{ fontWeight: 600, color: '#124' }}>Chi tiết giá</span>}
            content={
              <div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>
                  Giá nhập: <span style={{ fontWeight: 700 }}>{formatCurrency(record.price)}</span>{' '}
                  + {formatCurrency(record.glt_extra_cost_per_unit)}
                </div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>
                  Cost: <span>{formatCurrency(record.inventory_cost)}</span> →{' '}
                  <span style={{ fontWeight: 700 }}>{formatCurrency(record.cost_suggestion)}</span>{' '}
                  (chênh lệch:{' '}
                  <span style={{ fontWeight: 700 }}>{formatCurrency(record.cost_difference)}</span>)
                </div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>
                  Base Price: <span>{formatCurrency(record.base_price)}</span> →{' '}
                  <span style={{ fontWeight: 700 }}>
                    {formatCurrency(record.baseprice_suggestion)}
                  </span>{' '}
                  (chênh lệch:{' '}
                  <span style={{ fontWeight: 700 }}>{formatCurrency(record.baseprice_diff)}</span>,
                  markup: {formatCurrency(record.glt_baseprice_markup)})
                </div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>
                  Mô tả: {record.description || 'N/A'}
                </div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>Số lượng: {record.quantity}</div>
                <div style={{ fontWeight: 400, marginBottom: 4 }}>
                  Trạng thái:{' '}
                  <span>{record.glt_status === 'pending' ? 'Chờ xử lý' : 'Đã xử lý'}</span>
                </div>
              </div>
            }
          >
            <span
              style={{
                fontWeight: 600,
                cursor: 'pointer',
                color: record.cost_difference > 0 ? '#c0392b' : '#27ae60',
              }}
            >
              {formatCurrency(record.cost_difference)}
            </span>
          </Popover>
          {/* Nếu vẫn muốn có icon info thì để bên cạnh */}
          {/* <InfoCircleOutlined style={{ cursor: 'pointer', color: '#1890ff' }} /> */}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleAction(record, 'done')}
            loading={actionLoading}
          >
            Xử lý
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={() => handleAction(record, 'skip')}
            loading={actionLoading}
          >
            Bỏ qua
          </Button>
        </Space>
      ),
    },
    {
      title: 'Admin Note',
      key: 'admin_note',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.glt_admin_note ? (
            <Typography.Text
              ellipsis={{ tooltip: record.glt_admin_note }}
              style={{ maxWidth: 150 }}
            >
              {record.glt_admin_note}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">No note</Typography.Text>
          )}
          <Tooltip title="Add/Edit Note">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingNote(record);
                setNoteText(record.glt_admin_note || '');
                setNoteModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (error) {
    return <Alert message="Error Loading Orders" description={error} type="error" showIcon />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>Đơn đặt hàng chờ xử lý</Title>

      {/* Global Product Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>Sản phẩm:</Text>
          <Input
            placeholder="Tìm kiếm theo sản phẩm..."
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            style={{ width: 300 }}
            allowClear
            prefix={<SearchOutlined />}
          />
        </div>
        {(productFilter || quickFilterProduct) && (
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setProductFilter('');
              setQuickFilterProduct('');
              setDebouncedProductFilter('');
            }}
            size="small"
          >
            Xóa filter
          </Button>
        )}
        {(debouncedProductFilter || quickFilterProduct) && (
          <Tag color="blue">
            {quickFilterProduct
              ? `Filter: ${quickFilterProduct}`
              : `${filteredOrders.length} kết quả`}
          </Tag>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} đơn hàng`,
          }}
        />
      )}

      <Modal
        title="Admin Note"
        open={noteModalVisible}
        onOk={handleNoteSubmit}
        onCancel={() => setNoteModalVisible(false)}
      >
        <Input.TextArea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          placeholder="Enter admin note..."
        />
      </Modal>
    </Space>
  );
};

PurchaseOrderPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default PurchaseOrderPage;
