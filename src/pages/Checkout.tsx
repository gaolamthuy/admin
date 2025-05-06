import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
  Input,
  Button,
  Table,
  Form,
  InputNumber,
  Select,
  Space,
  Divider,
  message,
  Modal,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { supabase } from "../services/supabaseClient";
import { kiotVietService } from "../services/kiotVietService";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  contact_number: string;
  location_name: string;
  debt: number;
}

interface Product {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  unit: string;
  base_price: number;
  sell_price?: number;
  category_name: string;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface BranchInfo {
  id: number;
  name: string;
}

interface StaffInfo {
  id: number;
  name: string;
}

// Static data for branches and staff
const STATIC_BRANCHES: BranchInfo[] = [{ id: 15132, name: "Chi nhánh chính" }];

const STATIC_STAFF: StaffInfo[] = [{ id: 28310, name: "Hoàng Lâm" }];

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  useEffect(() => {
    // Get customer from route state if available
    if (location.state && location.state.customer) {
      setCustomer(location.state.customer);
    }

    fetchProducts();
    fetchBranches();
    fetchStaff();
  }, [location.state]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kiotviet_products")
        .select("id, kiotviet_id, code, name, unit, base_price, category_name")
        .eq("is_active", true)
        .order("name")
        .limit(100);

      if (error) {
        throw error;
      }

      if (data) {
        // Map data to match the Product interface
        const mappedProducts: Product[] = data.map((product: any) => ({
          ...product,
          sell_price: product.base_price, // Map base_price to sell_price for backward compatibility
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products. Check connection to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      // Use static data instead of fetching from database
      setBranches(STATIC_BRANCHES);
      // Set default branch
      if (STATIC_BRANCHES.length > 0) {
        setSelectedBranch(STATIC_BRANCHES[0].id);
      }
    } catch (error) {
      console.error("Using static branch data:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      // Use static data instead of fetching from database
      setStaffMembers(STATIC_STAFF);
      // Set default staff
      if (STATIC_STAFF.length > 0) {
        setSelectedStaff(STATIC_STAFF[0].id);
      }
    } catch (error) {
      console.error("Using static staff data:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchText) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kiotviet_products")
        .select("id, kiotviet_id, code, name, unit, base_price, category_name")
        .or(`name.ilike.%${searchText}%,code.ilike.%${searchText}%`)
        .eq("is_active", true)
        .limit(20);

      if (error) {
        throw error;
      }

      // Map data to match the Product interface
      const mappedProducts: Product[] = (data || []).map((product: any) => ({
        ...product,
        sell_price: product.base_price, // Map base_price to sell_price for backward compatibility
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error searching products:", error);
      message.error("Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart: CartItem[]) => {
      // Check if product already exists in cart
      const existingItemIndex = prevCart.findIndex(
        (item) => item.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          total:
            (existingItem.quantity + 1) *
            (existingItem.sell_price || existingItem.base_price),
        };
        return updatedCart;
      } else {
        // Add new item to cart
        return [
          ...prevCart,
          {
            ...product,
            quantity: 1,
            total: product.sell_price || product.base_price,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart: CartItem[]) =>
      prevCart.filter((item: CartItem) => item.id !== productId)
    );
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;

    setCart((prevCart: CartItem[]) =>
      prevCart.map((item: CartItem) => {
        if (item.id === productId) {
          return {
            ...item,
            quantity,
            total: quantity * (item.sell_price || item.base_price),
          };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum: number, item: CartItem) => sum + item.total, 0);
  };

  const handleCheckout = async () => {
    if (!customer) {
      message.error("Please select a customer");
      return;
    }

    if (cart.length === 0) {
      message.error("Cart is empty");
      return;
    }

    if (!selectedBranch) {
      message.error("Please select a branch");
      return;
    }

    if (!selectedStaff) {
      message.error("Please select a staff member");
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare data for KiotViet
      const invoiceDetails = cart.map((item: CartItem) => ({
        productId: item.kiotviet_id,
        quantity: item.quantity,
        price: item.sell_price || item.base_price,
      }));

      const totalAmount = calculateTotal();

      const payments = [
        {
          Method: "Cash",
          MethodStr: "Tiền mặt",
          Amount: totalAmount,
          Id: 0,
          AccountId: null,
          VoucherId: null,
          VoucherCampaignId: null,
        },
      ];

      // 2. Create invoice in KiotViet
      const response = await kiotVietService.createInvoice({
        branchId: selectedBranch,
        customerId: customer.kiotviet_id,
        soldById: selectedStaff,
        invoiceDetails,
        payments,
        totalAmount,
      });

      // 3. Handle success
      message.success(`Invoice created successfully: ${response.code}`);

      // 4. Print invoice
      Modal.confirm({
        title: "Print Invoice",
        content: "Do you want to print the invoice?",
        onOk: () => handlePrint(response),
        okText: "Yes, Print",
        cancelText: "No",
      });

      // 5. Clear cart
      setCart([]);
    } catch (error) {
      console.error("Checkout error:", error);
      message.error("Failed to complete checkout");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (invoiceData: any) => {
    setPrintLoading(true);
    try {
      // Generate invoice HTML
      const invoiceHtml = generateInvoiceHtml(invoiceData);

      // Use Electron's IPC to send print request
      if (window.electron) {
        window.electron.ipcRenderer.send("print-invoice", {
          html: invoiceHtml,
        });
      } else {
        // Fallback for non-electron environment (e.g. development)
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(invoiceHtml);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
    } catch (error) {
      console.error("Print error:", error);
      message.error("Failed to print invoice");
    } finally {
      setPrintLoading(false);
    }
  };

  const generateInvoiceHtml = (invoiceData: any) => {
    const dateStr = new Date(invoiceData.purchaseDate).toLocaleDateString(
      "vi-VN"
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${invoiceData.code}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; }
          .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
          .invoice-box table td { padding: 5px; vertical-align: top; }
          .invoice-box table tr td:nth-child(2) { text-align: right; }
          .invoice-box table tr.top table td { padding-bottom: 20px; }
          .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
          .invoice-box table tr.details td { padding-bottom: 20px; }
          .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
          .invoice-box table tr.item.last td { border-bottom: none; }
          .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
          .invoice-box .center { text-align: center; }
          @media only print {
            .invoice-box { box-shadow: none; border: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="2">
                <table>
                  <tr>
                    <td>
                      <h2>Gao Lam Thuy</h2>
                      <div>Address: 123 Lam Thuy St</div>
                      <div>Phone: 0123456789</div>
                    </td>
                    <td>
                      <h1>INVOICE</h1>
                      <div>Invoice #: ${invoiceData.code}</div>
                      <div>Date: ${dateStr}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr class="information">
              <td colspan="2">
                <table>
                  <tr>
                    <td>
                      <div><strong>Customer:</strong> ${
                        invoiceData.customerName || "Khách lẻ"
                      }</div>
                      <div><strong>Phone:</strong> ${
                        customer?.contact_number || "N/A"
                      }</div>
                    </td>
                    <td>
                      <div><strong>Branch:</strong> ${
                        invoiceData.branchName
                      }</div>
                      <div><strong>Staff:</strong> ${
                        invoiceData.soldByName
                      }</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr class="heading">
              <td>Item</td>
              <td>Price</td>
            </tr>
            
            ${invoiceData.invoiceDetails
              .map(
                (item: any) => `
              <tr class="item">
                <td>${item.productName} x ${item.quantity}</td>
                <td>${(item.price * item.quantity).toLocaleString(
                  "vi-VN"
                )} VND</td>
              </tr>
            `
              )
              .join("")}
            
            <tr class="total">
              <td></td>
              <td>Total: ${invoiceData.total.toLocaleString("vi-VN")} VND</td>
            </tr>
          </table>
          
          <div class="center" style="margin-top: 50px;">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const productColumns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price",
      dataIndex: "sell_price",
      key: "sell_price",
      render: (price: number) => `${price.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Action",
      key: "action",
      render: (record: Product) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => addToCart(record)}
        >
          Add
        </Button>
      ),
    },
  ];

  const cartColumns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Unit Price",
      dataIndex: "sell_price",
      key: "sell_price",
      render: (price: number) => `${price.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (_: any, record: CartItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value: number | null) =>
            updateQuantity(record.id, value as number)
          }
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `${total.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: CartItem) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
        />
      ),
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      <Header className="header">
        <div style={{ color: "white", fontSize: "1.5rem" }}>
          Gao Lam Thuy POS
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={["3"]}
            style={{ height: "100%", borderRight: 0 }}
          >
            <Menu.Item
              key="1"
              icon={<DashboardOutlined />}
              onClick={() => navigate("/")}
            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              key="2"
              icon={<UserOutlined />}
              onClick={() => navigate("/customers")}
            >
              Customers
            </Menu.Item>
            <Menu.Item key="3" icon={<ShoppingCartOutlined />}>
              Checkout
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content
            className="site-layout-background"
            style={{ padding: 24, margin: 0, minHeight: 280 }}
          >
            <Title level={2}>Checkout</Title>

            <Row gutter={16}>
              {/* Left Column - Product Selection */}
              <Col span={16}>
                <Card title="Products" style={{ marginBottom: 16 }}>
                  <Space style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="Search products by name or code"
                      value={searchText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchText(e.target.value)
                      }
                      style={{ width: 300 }}
                      onPressEnter={handleSearch}
                    />
                    <Button
                      type="primary"
                      onClick={handleSearch}
                      loading={loading}
                    >
                      Search
                    </Button>
                  </Space>

                  <Table
                    columns={productColumns}
                    dataSource={products}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </Card>

                <Card title="Shopping Cart">
                  <Table
                    columns={cartColumns}
                    dataSource={cart}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ y: 200 }}
                  />
                </Card>
              </Col>

              {/* Right Column - Customer & Checkout */}
              <Col span={8}>
                <Card title="Customer Information" style={{ marginBottom: 16 }}>
                  {customer ? (
                    <>
                      <p>
                        <strong>Name:</strong> {customer.name}
                      </p>
                      <p>
                        <strong>Code:</strong> {customer.code}
                      </p>
                      <p>
                        <strong>Phone:</strong> {customer.contact_number}
                      </p>
                      <p>
                        <strong>Location:</strong> {customer.location_name}
                      </p>
                      <Button
                        type="primary"
                        onClick={() => navigate("/customers")}
                        style={{ marginTop: 8 }}
                      >
                        Change Customer
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      onClick={() => navigate("/customers")}
                      style={{ marginTop: 8 }}
                    >
                      Select Customer
                    </Button>
                  )}
                </Card>

                <Card title="Checkout Details">
                  <Form form={form} layout="vertical">
                    <Form.Item label="Branch" required>
                      <Select
                        placeholder="Select branch"
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                      >
                        {branches.map((branch: BranchInfo) => (
                          <Option key={branch.id} value={branch.id}>
                            {branch.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label="Staff" required>
                      <Select
                        placeholder="Select staff"
                        value={selectedStaff}
                        onChange={setSelectedStaff}
                      >
                        {staffMembers.map((staff: StaffInfo) => (
                          <Option key={staff.id} value={staff.id}>
                            {staff.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Divider />

                    <div style={{ textAlign: "right" }}>
                      <Title level={3}>
                        Total: {calculateTotal().toLocaleString("vi-VN")} VND
                      </Title>
                    </div>

                    <Space style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={handleCheckout}
                        loading={loading}
                        disabled={!customer || cart.length === 0}
                      >
                        Complete Sale
                      </Button>

                      <Button
                        size="large"
                        icon={<PrinterOutlined />}
                        disabled={true}
                        loading={printLoading}
                      >
                        Print Last Receipt
                      </Button>
                    </Space>
                  </Form>
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Checkout;
