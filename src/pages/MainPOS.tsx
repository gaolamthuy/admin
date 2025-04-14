import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Button,
  Input,
  Space,
  Row,
  Col,
  Table,
  Tag,
  InputNumber,
  Modal,
  message,
  Alert
} from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  DeleteOutlined,
  UserOutlined,
  PrinterOutlined,
  BugOutlined
} from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import { kiotVietService } from '../services/kiotVietService';
import { runDiagnostics } from '../utils/debugUtils';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface Product {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  category_name: string;
  unit: string;
  base_price: number;
  full_name: string;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface Customer {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  contact_number: string;
  location_name: string;
}

const MainPOS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [receiptHtml, setReceiptHtml] = useState<string>('');
  
  const categories = [
    { key: 'gao-deo', name: 'gạo dẻo' },
    { key: 'gao-no', name: 'gạo nở' },
    { key: 'gao-thuong-hieu', name: 'gạo thương hiệu' },
    { key: 'lua-gao-lut', name: 'lúa, gạo lứt' },
    { key: 'tam', name: 'tấm' },
    { key: 'nep', name: 'nếp' },
    { key: 'khac', name: 'khác' }
  ];
  
  const units = [
    { key: 'le-1kg', name: 'lẻ 1kg' },
    { key: 'bao-50kg', name: '1 bao 50kg' }
  ];

  useEffect(() => {
    fetchProducts();
    runInitialDiagnostics();
  }, []);

  useEffect(() => {
    updateReceiptHtml();
  }, [cart, customer]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products...');
      const { data, error } = await supabase
        .from('kiotviet_products')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        console.log(`Fetched ${data.length} products`);
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (!customerSearchText) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kiotviet_customers')
        .select('*')
        .or(`name.ilike.%${customerSearchText}%,code.ilike.%${customerSearchText}%,contact_number.ilike.%${customerSearchText}%`)
        .limit(10);

      if (error) {
        throw error;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      message.error('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleUnitSelect = (unit: string | null) => {
    setSelectedUnit(unit === selectedUnit ? null : unit);
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchText) {
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.code.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      // This is a simplification - adjust based on your actual data structure
      filtered = filtered.filter(
        product => {
          const categoryLower = product.category_name?.toLowerCase() || '';
          const selectedCategoryName = categories.find(c => c.key === selectedCategory)?.name.toLowerCase() || '';
          return categoryLower.includes(selectedCategoryName);
        }
      );
    }
    
    if (selectedUnit) {
      // Filter by unit - adjust based on your actual data
      const unitName = selectedUnit === 'le-1kg' ? 'kg' : 'bao';
      filtered = filtered.filter(product => product.unit?.toLowerCase().includes(unitName));
    }
    
    return filtered.slice(0, 15); // Limit to 15 items as per design
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.base_price }
            : item
        );
      } else {
        return [...prevCart, {
          ...product,
          quantity: 1,
          total: product.base_price
        }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;
    
    setCart(prevCart => prevCart.map(item => 
      item.id === productId 
        ? { ...item, quantity, total: quantity * item.base_price }
        : item
    ));
  };

  const updateCartItemPrice = (productId: number, newPrice: number) => {
    if (newPrice <= 0) return;
    
    setCart(prevCart => prevCart.map(item => 
      item.id === productId 
        ? { ...item, base_price: newPrice, total: item.quantity * newPrice }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const selectCustomer = (customer: Customer) => {
    setCustomer(customer);
    setCustomerModalVisible(false);
  };

  const openCustomerSearch = () => {
    setCustomerModalVisible(true);
    setCustomerSearchText('');
    setCustomers([]);
  };

  const updateReceiptHtml = () => {
    const currentDate = new Date().toLocaleDateString('vi-VN');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt Preview</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 12px; }
          h2, h3 { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 5px; text-align: left; }
          th { border-bottom: 1px solid #000; }
          .text-right { text-align: right; }
          .total { font-weight: bold; border-top: 1px solid #000; }
        </style>
      </head>
      <body>
        <div>
          <h2>Gạo Lắm Thủy</h2>
          <p>234 Tô Hiệu, P.Hiệp Tân, Q.Tân Phú</p>
          <p>028-3948-3650 (Cửa hàng, Giao hàng)</p>
          <p>028-3845-3820 (Cửa hàng, Giao hàng)</p>
          <p>0901.467.300 (Bán giá, Đặt hàng, Kho)</p>
          <p>Facebook | galamthuy.vn</p>
          
          <h3>PHIẾU BÁN HÀNG</h3>
          <p>Số: HD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}</p>
          <p>${currentDate} ${new Date().toLocaleTimeString('vi-VN')}</p>
          
          <p><strong>KH:</strong> ${customer?.name || 'Khách lẻ'}</p>
          <p><strong>SĐT:</strong> ${customer?.contact_number || ''}</p>
          <p><strong>ĐC:</strong> ${customer?.location_name || ''}</p>
          <p><strong>Dư nợ trước:</strong> 0</p>
          
          <table>
            <tr>
              <th>Tên - Mã số hàng</th>
              <th>Đơn giá</th>
              <th class="text-right">Thành tiền</th>
            </tr>
            ${cart.map(item => `
              <tr>
                <td>${item.name} - (${item.quantity} ${item.unit})</td>
                <td>${item.base_price.toLocaleString('vi-VN')}</td>
                <td class="text-right">${item.total.toLocaleString('vi-VN')}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="2" class="text-right total">Tổng tiền hàng:</td>
              <td class="text-right total">${calculateTotal().toLocaleString('vi-VN')}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right">Tổng đơn:</td>
              <td class="text-right">${calculateTotal().toLocaleString('vi-VN')}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right">Giảm trừ KM:</td>
              <td class="text-right">0</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right">Đã thanh toán:</td>
              <td class="text-right">${calculateTotal().toLocaleString('vi-VN')}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right total">Kết còn TT:</td>
              <td class="text-right total">0</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
    
    setReceiptHtml(html);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.error('Please add products to cart before checkout');
      return;
    }

    if (!customer) {
      message.error('Please select a customer');
      return;
    }

    setLoading(true);
    try {
      // Create invoice details for KiotViet
      const invoiceDetails = cart.map(item => ({
        productId: item.kiotviet_id,
        quantity: item.quantity,
        price: item.base_price
      }));

      const totalAmount = calculateTotal();
      
      // Default payment structure
      const payments = [
        {
          Method: "Cash",
          MethodStr: "Tiền mặt",
          Amount: totalAmount,
          Id: -1,
          AccountId: null,
          VoucherId: null,
          VoucherCampaignId: null
        }
      ];

      // Get branch and staff info
      const { data: branchData } = await supabase
        .from('kiotviet_branches')
        .select('*')
        .limit(1);

      const { data: staffData } = await supabase
        .from('kiotviet_staff')
        .select('*')
        .limit(1);

      if (!branchData?.length || !staffData?.length) {
        throw new Error('Could not find branch or staff information');
      }

      // Create invoice in KiotViet
      const response = await kiotVietService.createInvoice({
        branchId: branchData[0].id,
        customerId: customer.kiotviet_id,
        soldById: staffData[0].id,
        invoiceDetails: invoiceDetails,
        payments: payments,
        totalAmount: totalAmount
      });

      message.success('Invoice created successfully!');
      
      // Print receipt
      printReceipt();
      
      // Clear cart after successful checkout
      setCart([]);
    } catch (error) {
      console.error('Error during checkout:', error);
      message.error('Failed to complete checkout');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    try {
      if (window.electron) {
        window.electron.ipcRenderer.send('print-invoice', { html: receiptHtml });
      } else {
        // Fallback for non-electron environment or development
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(receiptHtml);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      message.error('Failed to print receipt');
    }
  };

  const customerColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Phone',
      dataIndex: 'contact_number',
      key: 'contact_number',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <Button type="primary" onClick={() => selectCustomer(record)}>
          Select
        </Button>
      ),
    },
  ];

  const runInitialDiagnostics = async () => {
    const issues = await runDiagnostics();
    
    if (issues.length === 1 && issues[0] === 'All systems operational!') {
      console.log('Diagnostics passed, all systems operational!');
    } else {
      Modal.warning({
        title: 'Connection Issues Detected',
        content: (
          <div>
            <p>We've detected some potential connection issues:</p>
            <ul>
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
            <p>Check the console for more details (F12 or Ctrl+Shift+I).</p>
          </div>
        ),
        okText: 'Got it'
      });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>Gao Lam Thuy POS</Title>
        <Button 
          icon={<BugOutlined />} 
          type="text" 
          style={{ color: 'white' }} 
          onClick={async () => {
            const issues = await runDiagnostics();
            Modal.info({
              title: 'Diagnostic Results',
              content: (
                <div>
                  {issues.map((issue, index) => (
                    <Alert 
                      key={index} 
                      message={issue} 
                      type={issue === 'All systems operational!' ? 'success' : 'warning'} 
                      showIcon 
                      style={{ marginBottom: '8px' }}
                    />
                  ))}
                  <p>See console for detailed logs (F12 or Ctrl+Shift+I)</p>
                </div>
              ),
              width: 600
            });
          }}
        >
          Diagnostics
        </Button>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        <Row gutter={20}>
          {/* Left Column - Receipt Preview */}
          <Col span={10} style={{ minHeight: '400px' }}>
            <Card title="Receipt Preview" style={{ marginBottom: '20px', height: '100%' }}>
              <div style={{ height: '400px', overflow: 'auto' }}>
                <iframe 
                  srcDoc={receiptHtml}
                  style={{ width: '100%', height: '500px', border: 'none' }}
                  title="Receipt Preview"
                />
              </div>
            </Card>
          </Col>
          
          {/* Right Column - Product Selection & Cart */}
          <Col span={14}>
            {/* Category Filters */}
            <Card title="Filter Categories" style={{ marginBottom: '20px' }}>
              <Space wrap>
                {categories.map(category => (
                  <Button 
                    key={category.key}
                    type={selectedCategory === category.key ? 'primary' : 'default'}
                    onClick={() => handleCategorySelect(category.key)}
                    style={{ marginBottom: '10px' }}
                  >
                    {category.name}
                  </Button>
                ))}
              </Space>
            </Card>
            
            {/* Unit Filters */}
            <Card title="Filter Units" style={{ marginBottom: '20px' }}>
              <Space wrap>
                {units.map(unit => (
                  <Button 
                    key={unit.key}
                    type={selectedUnit === unit.key ? 'primary' : 'default'}
                    onClick={() => handleUnitSelect(unit.key)}
                  >
                    {unit.name}
                  </Button>
                ))}
              </Space>
            </Card>
            
            {/* Product Search */}
            <Card 
              title="Products" 
              style={{ marginBottom: '20px' }}
              extra={
                <Input 
                  placeholder="Search products" 
                  prefix={<SearchOutlined />} 
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                />
              }
            >
              <div style={{ height: '400px', overflow: 'auto' }}>
                {filterProducts().map(product => (
                  <Card 
                    key={product.id} 
                    size="small" 
                    style={{ marginBottom: '10px' }}
                    hoverable
                    onClick={() => addToCart(product)}
                  >
                    <Row>
                      <Col span={16}>
                        <Text strong>• {product.name}</Text>
                        <div>{product.full_name || 'No description'}</div>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <div>{product.base_price?.toLocaleString('vi-VN')} VND</div>
                      </Col>
                    </Row>
                  </Card>
                ))}
                {filterProducts().length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">No products found</Text>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Cart / Checkout Section */}
            <Card title="Shopping Cart">
              <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '20px' }}>
                {cart.length > 0 ? (
                  cart.map(item => (
                    <Card key={item.id} size="small" style={{ marginBottom: '10px' }}>
                      <Row align="middle">
                        <Col span={10}>
                          <Text strong>{item.name}</Text>
                        </Col>
                        <Col span={4}>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={value => updateCartItemQuantity(item.id, value as number)}
                            style={{ width: '80%' }}
                          />
                        </Col>
                        <Col span={4}>
                          <InputNumber
                            min={1000}
                            step={1000}
                            value={item.base_price}
                            onChange={value => updateCartItemPrice(item.id, value as number)}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <Text strong>{item.total.toLocaleString('vi-VN')} VND</Text>
                        </Col>
                        <Col span={2} style={{ textAlign: 'center' }}>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => removeFromCart(item.id)}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">Cart is empty</Text>
                  </div>
                )}
              </div>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Button 
                    type="primary" 
                    icon={<UserOutlined />} 
                    onClick={openCustomerSearch}
                    style={{ marginRight: '10px' }}
                  >
                    {customer ? `Customer: ${customer.name}` : 'Select Customer'}
                  </Button>
                </Col>
                <Col>
                  <Title level={3}>Total: {calculateTotal().toLocaleString('vi-VN')} VND</Title>
                </Col>
              </Row>
              
              <Row justify="end" style={{ marginTop: '20px' }}>
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />} 
                  size="large"
                  onClick={handleCheckout}
                  loading={loading}
                  disabled={cart.length === 0 || !customer}
                  style={{ marginRight: '10px' }}
                >
                  Checkout
                </Button>
                <Button 
                  icon={<PrinterOutlined />} 
                  size="large"
                  onClick={printReceipt}
                  disabled={cart.length === 0}
                >
                  Print Receipt
                </Button>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
      
      {/* Customer Search Modal */}
      <Modal
        title="Select Customer"
        visible={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space style={{ marginBottom: '20px' }}>
          <Input
            placeholder="Search customers by name, code or phone"
            value={customerSearchText}
            onChange={e => setCustomerSearchText(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={searchCustomers}
          />
          <Button type="primary" onClick={searchCustomers} loading={loading}>
            Search
          </Button>
        </Space>
        
        <Table
          columns={customerColumns}
          dataSource={customers}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          loading={loading}
        />
      </Modal>
    </Layout>
  );
};

// Need to declare window.electron for TypeScript
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
      };
    };
  }
}

export default MainPOS; 