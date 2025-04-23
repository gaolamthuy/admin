import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Spin,
  Dropdown,
  Menu,
  Switch,
  InputRef,
  Result
} from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  DeleteOutlined,
  UserOutlined,
  PrinterOutlined,
  BugOutlined,
  HistoryOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import { runDiagnostics } from '../utils/debugUtils';
import { debounce } from 'lodash';
import { Customer, Product, CartItem, Settings, Invoice, InvoiceDetail } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Suppress Electron D-Bus errors in console
if (window.electron) {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out D-Bus related errors
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('Failed to connect to the bus') || 
         args[0].includes('Autofill.enable'))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Function to remove Vietnamese accents
const removeVietnameseAccents = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Custom styles for larger text
const styles = {
  largeText: { fontSize: '16px' },
  title: { fontSize: '20px' },
  header: { fontSize: '18px' },
  total: { fontSize: '24px' }
};

const FallbackUI: React.FC = () => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>Gao Lam Thuy POS</Title>
        <Button 
          type="primary"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </Header>
      <Content style={{ padding: '50px', textAlign: 'center' }}>
        <Card>
          <Result
            status="warning"
            title="Interface Loading Issue"
            subTitle="The POS interface could not be loaded properly."
            extra={[
              <div key="debug" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <Title level={5}>Diagnostic Information:</Title>
                <ul>
                  <li>Window object exists: {typeof window !== 'undefined' ? 'Yes' : 'No'}</li>
                  <li>Electron detected: {typeof window !== 'undefined' && !!window.electron ? 'Yes' : 'No'}</li>
                  <li>React version: {React.version}</li>
                  <li>Timestamp: {new Date().toLocaleString()}</li>
                </ul>
              </div>,
              <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                Try Again
              </Button>,
            ]}
          />
        </Card>
      </Content>
    </Layout>
  );
};

const MainPOS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('gao-deo');
  const [selectedUnit, setSelectedUnit] = useState<string | null>('le-1kg');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [receiptHtml, setReceiptHtml] = useState<string>('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [customerHistoryVisible, setCustomerHistoryVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    autoPrint: false
  });
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerInputRef, setCustomerInputRef] = useState<React.RefObject<InputRef> | null>(null);
  const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [customerNoteVisible, setCustomerNoteVisible] = useState(false);
  const [lastOrderItems, setLastOrderItems] = useState<InvoiceDetail[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [lastInvoices, setLastInvoices] = useState<any[]>([]);
  
  const categories = [
    { key: 'gao-deo', name: 'gạo dẻo' },
    { key: 'gao-no', name: 'gạo nở' },
    { key: 'gao-chinh-hang', name: 'gạo chính hãng' },
    { key: 'lua-gao-lut', name: 'lúa - gạo lứt' },
    { key: 'tam', name: 'tấm' },
    { key: 'nep', name: 'nếp' },
    { key: 'khac', name: 'khác' }
  ];
  
  const units = [
    { key: 'le-1kg', name: 'lẻ 1kg' },
    { key: 'bao-50kg', name: 'bao 50kg' }
  ];

  useEffect(() => {
    console.log('MainPOS component mounted');
    console.log('Checking environment:', {
      hasWindow: typeof window !== 'undefined',
      hasElectron: typeof window !== 'undefined' && !!window.electron,
      hasSupabase: typeof supabase !== 'undefined'
    });
    
    // Force a re-render after a short delay
    const timer = setTimeout(() => {
      console.log('Forcing re-render');
      setLoading(prev => !prev);
      setLoading(prev => !prev);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchProducts();
    runInitialDiagnostics();
    loadSettings();
  }, []);

  useEffect(() => {
    updateReceiptHtml();
  }, [cart, customer]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products from Supabase...');
      let error = null;
      let data = null;
      
      try {
        const result = await supabase
          .from('kv_products')
          .select('*')
          .eq('is_active', true)
          .limit(100);
        
        error = result.error;
        data = result.data;
      } catch (e) {
        console.error('Error making Supabase call:', e);
        error = e;
      }

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        console.log(`Fetched ${data.length} products`);
        setProducts(data);
      } else {
        console.warn('No products returned from database');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products. Check console for details.');
      // Set empty products array as fallback
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (!customerSearchText) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kv_customers')
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
      // Map category keys to their display names for filtering
      const categoryMapping: {[key: string]: string} = {
        'gao-deo': 'gạo dẻo',
        'gao-no': 'gạo nở',
        'gao-chinh-hang': 'gạo chính hãng',
        'lua-gao-lut': 'lúa - gạo lứt',
        'tam': 'tấm',
        'nep': 'nếp',
        'khac': 'khác'
      };
      
      // Get the category name to filter by
      const categoryName = categoryMapping[selectedCategory];
      
      filtered = filtered.filter(
        product => {
          const categoryLower = product.category_name?.toLowerCase() || '';
          return categoryLower.includes(categoryName.toLowerCase());
        }
      );
    }
    
    if (selectedUnit) {
      // Exact unit matching
      const unitMapping: {[key: string]: string} = {
        'le-1kg': 'kg',
        'bao-50kg': 'bao 50kg'
      };
      
      const unitName = unitMapping[selectedUnit];
      
      filtered = filtered.filter(
        product => product.unit?.toLowerCase() === unitName.toLowerCase()
      );
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

  const selectCustomer = async (customer: Customer) => {
    setCustomer(customer);
    setCustomerModalVisible(false);
    
    // Fetch the last order for this customer
    await fetchLastOrder(customer.kiotviet_id);
    
    // Open the customer note modal
    setCustomerNoteVisible(true);
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
      // Generate a random invoice code
      const invoiceCode = `HD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      const totalAmount = calculateTotal();
      
      // 1. Create the invoice in supabase
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('kiotviet_invoices')
        .insert({
          code: invoiceCode,
          kiotviet_customer_id: customer.kiotviet_id,
          total: totalAmount,
          subtotal: totalAmount,
          purchase_date: new Date(),
          status_value: 'Hoàn thành'
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // 2. Create invoice details for all cart items
      const invoiceDetails = cart.map(item => ({
        kiotviet_invoice_id: invoiceData.id,
        kiotviet_product_id: item.kiotviet_id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.base_price,
        sub_total: item.total
      }));
      
      const { error: detailsError } = await supabase
        .from('kiotviet_invoice_details')
        .insert(invoiceDetails);
      
      if (detailsError) throw detailsError;

      message.success('Invoice created successfully!');
      
      // Auto-print if enabled
      if (settings.autoPrint) {
        printReceipt();
      }
      
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

  // Create debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchCustomers = useCallback(
    debounce((searchValue: string) => {
      if (searchValue.length < 3) return;
      performCustomerSearch(searchValue);
    }, 300),
    []
  );

  // Function to handle customer search input change
  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchText(value);
    if (value.length >= 3) {
      debouncedSearchCustomers(value);
    } else {
      setCustomers([]);
    }
  };

  // Function to perform the actual search
  const performCustomerSearch = async (searchValue: string) => {
    if (!searchValue) return;
    
    setCustomerLoading(true);
    try {
      const plainTextSearch = removeVietnameseAccents(searchValue.toLowerCase());
      
      const { data, error } = await supabase
        .from('kv_customers')
        .select('*')
        .or(
          `name.ilike.%${searchValue}%,` +
          `code.ilike.%${searchValue}%,` +
          `contact_number.ilike.%${searchValue}%`
        )
        .limit(10);

      if (error) {
        throw error;
      }

      // Add highlighting to matched customers
      const highlightedCustomers = (data || []).map((customer: Customer & { highlightedName?: string }) => ({
        ...customer,
        highlightedName: highlightMatch(customer.name, searchValue)
      }));

      setCustomers(highlightedCustomers);
    } catch (error) {
      console.error('Error searching customers:', error);
      message.error('Failed to search customers');
    } finally {
      setCustomerLoading(false);
    }
  };

  // Function to highlight matched text
  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text;
    
    // For simplicity, we're just returning the original text
    // In a real implementation, you would wrap matched parts in HTML tags
    return text;
  };

  // Function to view customer history
  const viewCustomerHistory = async (customerId: number) => {
    setCustomerLoading(true);
    try {
      const { data, error } = await supabase
        .from('kiotviet_invoices')
        .select('*, kiotviet_invoice_details(*)')
        .eq('kiotviet_customer_id', customerId)
        .eq('status_value', 'Hoàn thành')
        .order('purchase_date', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Store all invoices for navigation
        setLastInvoices(data);
        setCurrentInvoiceIndex(0);
        
        // Set the current invoice details
        if (data[0].kiotviet_invoice_details) {
          setLastOrderItems(data[0].kiotviet_invoice_details);
        } else {
          setLastOrderItems([]);
        }
        
        // Open the customer note modal
        setCustomerNoteVisible(true);
      } else {
        setLastInvoices([]);
        setLastOrderItems([]);
        message.info('No purchase history found for this customer');
      }
    } catch (error) {
      console.error('Error fetching last orders:', error);
      message.error('Failed to fetch last orders');
      setLastInvoices([]);
      setLastOrderItems([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Function to navigate between invoices
  const navigateInvoices = (direction: 'prev' | 'next') => {
    let newIndex = currentInvoiceIndex;
    
    if (direction === 'prev') {
      newIndex = Math.max(0, currentInvoiceIndex - 1);
    } else {
      newIndex = Math.min(lastInvoices.length - 1, currentInvoiceIndex + 1);
    }
    
    if (newIndex !== currentInvoiceIndex) {
      setCurrentInvoiceIndex(newIndex);
      if (lastInvoices[newIndex]?.kiotviet_invoice_details) {
        setLastOrderItems(lastInvoices[newIndex].kiotviet_invoice_details);
      } else {
        setLastOrderItems([]);
      }
    }
  };

  // Customer columns with highlighting
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
      render: (text: string, record: any) => (
        <span dangerouslySetInnerHTML={{ __html: record.highlightedName || text }} />
      ),
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
        <Space>
          <Button type="primary" size="small" onClick={() => selectCustomer(record)}>
            Select
          </Button>
          <Button 
            type="text" 
            icon={<HistoryOutlined />} 
            size="small"
            onClick={() => viewCustomerHistory(record.kiotviet_id)}
          />
        </Space>
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

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('pos_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('pos_settings', JSON.stringify(newSettings));
    setSettingsVisible(false);
    message.success('Settings saved');
  };

  const renderSafely = () => {
    try {
      return (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
          <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <Title level={4} style={{ color: 'white', margin: 0, ...styles.title }}>Gao Lam Thuy POS</Title>
            <Space>
              <Button 
                icon={<SettingOutlined />} 
                type="text" 
                style={{ color: 'white', ...styles.largeText }} 
                onClick={() => setSettingsVisible(true)}
              >
                Settings
              </Button>
              <Button 
                icon={<BugOutlined />} 
                type="text" 
                style={{ color: 'white', ...styles.largeText }} 
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
                        <p style={styles.largeText}>See console for detailed logs (F12 or Ctrl+Shift+I)</p>
                      </div>
                    ),
                    width: 600
                  });
                }}
              >
                Diagnostics
              </Button>
            </Space>
          </Header>
          
          <Content style={{ padding: '16px', backgroundColor: '#f0f2f5', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <Row gutter={[16, 16]} style={{ height: '100%' }}>
              {/* Left Column - Customer Selection and Cart */}
              <Col span={8} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card style={{ marginBottom: '16px', flexShrink: 0 }}>
                  {/* Customer Selection with Dropdown */}
                  <div style={{ position: 'relative' }}>
                    {customer ? (
                      <Card size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={styles.largeText}>
                            <Text strong>{customer.name}</Text>
                            <br />
                            <Text type="secondary">{customer.contact_number}</Text>
                            <br />
                            <Text type="secondary">{customer.address || customer.location_name || ''}</Text>
                          </div>
                          <Space>
                            <Button 
                              type="default" 
                              icon={<HistoryOutlined />}
                              onClick={() => viewCustomerHistory(customer.kiotviet_id)} 
                              style={styles.largeText}
                            >
                              History
                            </Button>
                            <Button 
                              type="text" 
                              icon={<DeleteOutlined />} 
                              onClick={() => setCustomer(null)} 
                              style={styles.largeText}
                            />
                          </Space>
                        </div>
                      </Card>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <Input
                          placeholder="🔍 Search customers..."
                          value={customerSearchText}
                          onChange={handleCustomerSearchChange}
                          onFocus={() => setSearchDropdownVisible(true)}
                          suffix={
                            <Button 
                              type="text" 
                              icon={<SearchOutlined />} 
                              onClick={() => setCustomerModalVisible(true)} 
                              style={styles.largeText}
                            />
                          }
                          style={{ width: '100%', ...styles.largeText }}
                        />
                        {searchDropdownVisible && customers.length > 0 && (
                          <Card 
                            style={{ 
                              position: 'absolute', 
                              width: '100%', 
                              zIndex: 1000,
                              maxHeight: '200px',
                              overflow: 'auto'
                            }}
                            bodyStyle={{ padding: '8px' }}
                          >
                            {customers.map(customer => (
                              <div 
                                key={customer.id}
                                style={{ 
                                  padding: '8px', 
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0'
                                }}
                                onClick={() => {
                                  selectCustomer(customer);
                                  setSearchDropdownVisible(false);
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '';
                                }}
                              >
                                <div style={styles.largeText}>
                                  <Text strong>{customer.name}</Text> - <Text>{customer.contact_number || 'No phone'}</Text>
                                </div>
                                <div style={styles.largeText}>
                                  <Text type="secondary">{customer.address || customer.location_name || 'No address'}</Text>
                                </div>
                              </div>
                            ))}
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Total Amount Display */}
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text style={styles.largeText}>Total: </Text>
                      <Text strong style={{ fontSize: '20px' }}>{calculateTotal().toLocaleString('vi-VN')} VND</Text>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<ShoppingCartOutlined />} 
                      size="large"
                      onClick={handleCheckout}
                      loading={loading}
                      disabled={cart.length === 0}
                    >
                      Checkout
                    </Button>
                  </div>
                </Card>
                
                {/* Shopping Cart */}
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Shopping Cart</span>
                      {cart.length > 0 && (
                        <Button 
                          danger 
                          size="small" 
                          onClick={() => {
                            Modal.confirm({
                              title: 'Clear shopping cart',
                              content: 'Are you sure you want to remove all items from the cart?',
                              onOk: () => {
                                setCart([]);
                                message.success('Cart cleared');
                              }
                            });
                          }}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  }
                  style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Table
                      dataSource={cart}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ y: 'calc(100vh - 350px)' }}
                      columns={[
                        {
                          title: 'Product',
                          dataIndex: 'name',
                          key: 'name',
                          ellipsis: true,
                          render: (text, record) => (
                            <div style={styles.largeText}>
                              <div>
                                <Text strong>{record.full_name || record.name}</Text>
                              </div>
                              <div>
                                <Text type="secondary">{record.order_template || record.code}</Text>
                              </div>
                            </div>
                          )
                        },
                        {
                          title: 'Qty',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          width: 70,
                          render: (text, record) => (
                            <InputNumber
                              min={1}
                              value={record.quantity}
                              onChange={(value) => updateCartItemQuantity(record.id, value as number)}
                              size="small"
                              style={{ width: '100%' }}
                            />
                          )
                        },
                        {
                          title: 'Price',
                          dataIndex: 'base_price',
                          key: 'base_price',
                          width: 90,
                          render: (text, record) => (
                            <InputNumber
                              min={0}
                              value={record.base_price}
                              onChange={(value) => updateCartItemPrice(record.id, value as number)}
                              size="small"
                              style={{ width: '100%' }}
                              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, ''))}
                            />
                          )
                        },
                        {
                          title: '',
                          key: 'action',
                          width: 40,
                          render: (_, record) => (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeFromCart(record.id)}
                              size="small"
                            />
                          )
                        }
                      ]}
                    />
                  </div>
                </Card>
              </Col>
              
              {/* Right Column - Filters and Products */}
              <Col span={16} style={{ height: '100%' }}>
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Combined Filters in One Row */}
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div>
                        <Text strong style={{ marginRight: '8px', fontSize: '16px' }}>Category:</Text>
                        {categories.map(category => (
                          <Tag
                            key={category.key}
                            color={selectedCategory === category.key ? '#108ee9' : 'default'}
                            style={{ 
                              cursor: 'pointer', 
                              margin: '0 4px 4px 0',
                              padding: '4px 8px',
                              fontSize: '16px'
                            }}
                            onClick={() => handleCategorySelect(category.key)}
                          >
                            {category.name}
                          </Tag>
                        ))}
                      </div>
                      <div style={{ marginLeft: '16px' }}>
                        <Text strong style={{ marginRight: '8px', fontSize: '16px' }}>Unit:</Text>
                        {units.map(unit => (
                          <Tag
                            key={unit.key}
                            color={selectedUnit === unit.key ? '#108ee9' : 'default'}
                            style={{ 
                              cursor: 'pointer', 
                              margin: '0 4px 4px 0',
                              padding: '4px 8px',
                              fontSize: '16px'
                            }}
                            onClick={() => handleUnitSelect(unit.key)}
                          >
                            {unit.name}
                          </Tag>
                        ))}
                      </div>
                    </div>
                    <Input
                      placeholder="Search products..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '250px', height: '40px', fontSize: '16px' }}
                      suffix={<SearchOutlined style={{ fontSize: '18px' }} />}
                    />
                  </div>
                  
                  {/* Products Grid - Two Columns, 7 Rows with Scroll */}
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Row gutter={[16, 16]} style={{ marginRight: '4px' }}>
                      {filterProducts().map(product => (
                        <Col span={12} key={product.id} style={{ marginBottom: '16px' }}>
                          <Card 
                            hoverable 
                            size="small"
                            onClick={() => addToCart(product)}
                            style={{ height: '100%' }}
                          >
                            <div style={styles.largeText}>
                              <div>
                                <Text strong>{product.full_name}</Text>
                                <span style={{ float: 'right' }}>{product.base_price.toLocaleString('vi-VN')} VND</span>
                              </div>
                              <div>
                                <Text type="secondary">{product.order_template || ''}</Text>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    {loading && <div style={{ textAlign: 'center', margin: '20px' }}><Spin /></div>}
                  </div>
                </Card>
              </Col>
            </Row>
          </Content>
          
          {/* Customer History Modal */}
          <Modal
            title={<span style={styles.header}>Customer Purchase History</span>}
            open={customerHistoryVisible}
            onCancel={() => setCustomerHistoryVisible(false)}
            footer={null}
            width={800}
          >
            <Table
              dataSource={customerHistory}
              rowKey="id"
              columns={[
                {
                  title: <span style={styles.largeText}>Date</span>,
                  dataIndex: 'purchase_date',
                  key: 'purchase_date',
                  render: (text) => <span style={styles.largeText}>{new Date(text).toLocaleDateString('vi-VN')}</span>,
                },
                {
                  title: <span style={styles.largeText}>Invoice #</span>,
                  dataIndex: 'code',
                  key: 'code',
                  render: (text) => <span style={styles.largeText}>{text}</span>,
                },
                {
                  title: <span style={styles.largeText}>Total</span>,
                  dataIndex: 'total',
                  key: 'total',
                  render: (text) => <span style={styles.largeText}>{`${Number(text).toLocaleString('vi-VN')} VND`}</span>,
                },
              ]}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    dataSource={record.kiotviet_invoice_details}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: <span style={styles.largeText}>Product</span>,
                        dataIndex: 'product_name',
                        key: 'product_name',
                        render: (text) => <span style={styles.largeText}>{text}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Quantity</span>,
                        dataIndex: 'quantity',
                        key: 'quantity',
                        render: (text) => <span style={styles.largeText}>{text}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Price</span>,
                        dataIndex: 'price',
                        key: 'price',
                        render: (text) => <span style={styles.largeText}>{`${Number(text).toLocaleString('vi-VN')} VND`}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Subtotal</span>,
                        dataIndex: 'sub_total',
                        key: 'sub_total',
                        render: (text) => <span style={styles.largeText}>{`${Number(text).toLocaleString('vi-VN')} VND`}</span>,
                      },
                    ]}
                  />
                ),
              }}
              loading={customerLoading}
            />
          </Modal>

          {/* Settings Modal */}
          <Modal
            title={<span style={styles.header}><SettingOutlined /> Settings</span>}
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setSettingsVisible(false)} style={styles.largeText}>
                Cancel
              </Button>,
              <Button 
                key="save" 
                type="primary" 
                onClick={() => saveSettings(settings)}
                style={styles.largeText}
              >
                Save
              </Button>
            ]}
            width={500}
          >
            <div style={{ padding: '16px 0' }}>
              <Card title={<span style={styles.largeText}>Print Settings</span>}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.largeText}>Automatically print receipt after checkout</Text>
                  <Switch 
                    checked={settings.autoPrint} 
                    onChange={(checked) => setSettings({...settings, autoPrint: checked})}
                    checkedChildren={<PrinterOutlined />}
                    unCheckedChildren={<PrinterOutlined />}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>
              </Card>
            </div>
          </Modal>

          {/* Customer Note Modal */}
          <Modal
            title={<div style={styles.header}>
              <span>Customer Note</span>
              <div style={{ fontSize: '16px', marginTop: '8px' }}>
                {customer?.name} - {customer?.contact_number}
              </div>
            </div>}
            open={customerNoteVisible}
            onCancel={() => setCustomerNoteVisible(false)}
            footer={[
              <Button key="cancel" onClick={() => setCustomerNoteVisible(false)} style={styles.largeText}>
                Close
              </Button>,
              <Button
                key="addAll"
                type="primary" 
                onClick={addAllSuggestedProducts}
                disabled={lastOrderItems.length === 0}
                style={styles.largeText}
              >
                Add All to Cart
              </Button>
            ]}
            width={600}
          >
            <div style={{ marginBottom: '20px' }}>
              <Card title={<span style={styles.header}>Customer Notes</span>}>
                <div style={styles.largeText}>
                  {customer?.comments ? (
                    <div dangerouslySetInnerHTML={{ __html: customer.comments.replace(/\n/g, '<br>') }} />
                  ) : (
                    <Text type="secondary">No notes available for this customer.</Text>
                  )}
                </div>
              </Card>
            </div>
            
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.header}>Suggested Order (Based on Last Purchase)</span>
                  <div>
                    {lastInvoices.length > 0 && (
                      <Space>
                        <Text style={styles.largeText}>
                          {currentInvoiceIndex + 1} / {lastInvoices.length}
                        </Text>
                        <Button 
                          icon={<LeftOutlined />} 
                          disabled={currentInvoiceIndex === 0}
                          onClick={() => navigateInvoices('prev')}
                          size="small"
                        />
                        <Button 
                          icon={<RightOutlined />} 
                          disabled={currentInvoiceIndex === lastInvoices.length - 1}
                          onClick={() => navigateInvoices('next')}
                          size="small"
                        />
                      </Space>
                    )}
                  </div>
                </div>
              }
            >
              {loadingSuggestions ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                  <div style={{ marginTop: '10px' }}>Loading suggestions...</div>
                </div>
              ) : lastOrderItems.length > 0 ? (
                <>
                  {lastInvoices.length > 0 && currentInvoiceIndex < lastInvoices.length && (
                    <div style={{ marginBottom: '10px' }}>
                      <Text style={styles.largeText}>
                        Invoice: {lastInvoices[currentInvoiceIndex].code} - 
                        Date: {new Date(lastInvoices[currentInvoiceIndex].purchase_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  )}
                  <Table
                    dataSource={lastOrderItems}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: <span style={styles.largeText}>Product</span>,
                        dataIndex: 'product_name',
                        key: 'product_name',
                        render: (text) => <span style={styles.largeText}>{text}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Quantity</span>,
                        dataIndex: 'quantity',
                        key: 'quantity',
                        render: (text) => <span style={styles.largeText}>{text}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Price</span>,
                        dataIndex: 'price',
                        key: 'price',
                        render: (text) => <span style={styles.largeText}>{`${Number(text).toLocaleString('vi-VN')} VND`}</span>,
                      },
                      {
                        title: <span style={styles.largeText}>Action</span>,
                        key: 'action',
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => addSuggestedProductToCart(record)}
                          >
                            Add
                          </Button>
                        ),
                      }
                    ]}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary" style={styles.largeText}>No previous purchases found.</Text>
                </div>
              )}
            </Card>
          </Modal>
        </Layout>
      );
    } catch (error) {
      console.error('Error rendering MainPOS component:', error);
      return <FallbackUI />;
    }
  };

  // Function to fetch last order for a customer
  const fetchLastOrder = async (customerId: number) => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('kiotviet_invoices')
        .select('*, kiotviet_invoice_details(*)')
        .eq('kiotviet_customer_id', customerId)
        .eq('status_value', 'Hoàn thành')
        .order('purchase_date', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Store all invoices for navigation
        setLastInvoices(data);
        setCurrentInvoiceIndex(0);
        
        // Set the current invoice details
        if (data[0].kiotviet_invoice_details) {
          setLastOrderItems(data[0].kiotviet_invoice_details);
        } else {
          setLastOrderItems([]);
        }
      } else {
        setLastInvoices([]);
        setLastOrderItems([]);
      }
    } catch (error) {
      console.error('Error fetching last orders:', error);
      message.error('Failed to fetch last orders');
      setLastInvoices([]);
      setLastOrderItems([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Function to add a suggested product to cart
  const addSuggestedProductToCart = async (detail: InvoiceDetail) => {
    try {
      // Get the full product details from the database
      const { data, error } = await supabase
        .from('kiotviet_products')
        .select('*')
        .eq('kiotviet_id', detail.kiotviet_product_id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Add product to cart with quantity and price from the last order
        const existingItem = cart.find(item => item.id === data.id);
        
        if (existingItem) {
          // If item already exists in cart, update its quantity and price
          updateCartItemQuantity(existingItem.id, existingItem.quantity + detail.quantity);
          updateCartItemPrice(existingItem.id, detail.price || data.base_price);
        } else {
          // Add as new item with quantity from the last order
          setCart(prevCart => [...prevCart, {
            ...data,
            base_price: detail.price || data.base_price,
            quantity: detail.quantity,
            total: detail.quantity * (detail.price || data.base_price)
          }]);
        }
        
        message.success('Added to cart');
      }
    } catch (error) {
      console.error('Error adding suggested product:', error);
      message.error('Failed to add product to cart');
    }
  };

  // Function to add all suggested products
  const addAllSuggestedProducts = async () => {
    message.loading('Adding all suggested products...', 1);
    
    for (const item of lastOrderItems) {
      await addSuggestedProductToCart(item);
    }
    
    setCustomerNoteVisible(false);
    message.success('All products added to cart');
  };

  return renderSafely();
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