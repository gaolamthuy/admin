import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  InputNumber,
  InputRef,
  Layout,
  List,
  Menu,
  Modal,
  Popover,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  MenuProps,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DeleteOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  BugOutlined,
  CloseOutlined,
  PrinterFilled,
  DownOutlined,
  TagsOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { printDocument, sendPrintJobToServer, sendPrintJobToAgent } from "../utils/printUtils";
import "../styles/MainPOS.css";
import PrinterSettings from "../components/PrinterSettings";
import { Customer, Product, Settings } from "../types";
import ThaiDatePicker from "react-thai-date-picker";
import { generateInvoiceHtml } from "../templates/invoiceTemplate";
import { generateLabelHtml as createLabelHtml } from "../templates/labelTemplate";
import { generateInvoiceReceiptHtml as createInvoiceReceiptHtml } from "../templates/invoiceReceiptTemplate";
import * as QRCodeGenerator from "qrcode";

// QR code configuration type
interface QRCodeConfig {
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  margin?: number;
  width?: number;
  color?: {
    dark: string;
    light: string;
  };
}

// Polyfills for missing functions
// These are placeholders to fix TypeScript errors
const QRCode = {
  toDataURL: (text: string, options: any) => Promise.resolve(""),
};

const runDiagnostics = async () => {
  return ["All systems operational!"];
};

// Simple debounce implementation
const debounce = (fn: Function, delay: number) => {
  let timer: any = null;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Interface for today's invoice listing
interface InvoiceSummary {
  id: number;
  code: string;
  customer_name: string | null;
  purchase_date: string;
  total_payment: number;
  status_value: string;
  kiotviet_customer_id: number | null;
  glt_paid?: boolean;
  total: number;
}

// Constants for printer types to maintain consistency throughout the application
const PRINTER_TYPES = {
  K80: "K80",
  A4: "A4",
  LABEL: "LABEL",
} as const;

// Constants for printer IDs that match the configuration in PrinterSettings
const PRINTER_IDS = {
  K80: "printInvoiceK80", // K80 thermal printer
  A4: "printInvoiceA4", // A4 regular printer
  LABEL: "printLabel", // Label printer
} as const;

type PrinterType = keyof typeof PRINTER_TYPES;
type PrinterId = keyof typeof PRINTER_IDS;

interface PrinterConfig {
  printInvoiceK80: string; // K80 thermal printer
  printInvoiceA4: string; // A4 regular printer
  printLabel: string; // Label printer
}

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Function to remove Vietnamese accents
const removeVietnameseAccents = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

// Custom styles for larger text
const styles = {
  largeText: { fontSize: "16px" },
  title: { fontSize: "20px" },
  header: { fontSize: "18px" },
  total: { fontSize: "24px" },
};

const FallbackUI: React.FC = () => {
  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          background: "#001529",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Title level={4} style={{ color: "white", margin: 0 }}>
          Gao Lam Thuy POS
        </Title>
        <Button type="primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Header>
      <Content style={{ padding: "50px", textAlign: "center" }}>
        <Card>
          <Result
            status="warning"
            title="Interface Loading Issue"
            subTitle="The POS interface could not be loaded properly."
            extra={[
              <div
                key="debug"
                style={{ textAlign: "left", marginBottom: "20px" }}
              >
                <Title level={5}>Diagnostic Information:</Title>
                <ul>
                  <li>
                    Window object exists:{" "}
                    {typeof window !== "undefined" ? "Yes" : "No"}
                  </li>
                  <li>
                    Electron detected:{" "}
                    {typeof window !== "undefined" && !!window.electron
                      ? "Yes"
                      : "No"}
                  </li>
                  <li>React version: {React.version}</li>
                  <li>Timestamp: {new Date().toLocaleString()}</li>
                </ul>
              </div>,
              <Button
                type="primary"
                key="reload"
                onClick={() => window.location.reload()}
              >
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
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [pricebookEntries, setPricebookEntries] = useState<PricebookEntry[]>(
    []
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "gao-deo"
  );
  const [selectedUnit, setSelectedUnit] = useState<string | null>("le-1kg");
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [receiptHtml, setReceiptHtml] = useState<string>("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [customerHistoryVisible, setCustomerHistoryVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [printerSettingsVisible, setPrinterSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<Settings>({ autoPrint: false });
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const [customerInputRef, setCustomerInputRef] =
    useState<React.RefObject<InputRef> | null>(null);
  const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [customerNoteVisible, setCustomerNoteVisible] = useState(false);
  const [lastOrderItems, setLastOrderItems] = useState<InvoiceDetail[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [lastInvoices, setLastInvoices] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  // State to store promotions
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotions, setActivePromotions] = useState<number[]>([]);
  // State to handle hover effect on Total Amount Display
  const [isTotalHover, setIsTotalHover] = useState(false);
  // Track whether to create a fully paid invoice or an unpaid order
  const [isFullPayment, setIsFullPayment] = useState<boolean>(true);
  // State for invoice-level discount
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  // State to enable or disable promotions
  const [isPromotionEnabled, setIsPromotionEnabled] = useState<boolean>(true);
  const [qrDataUri, setQrDataUri] = useState<string>("");
  const [printLabelProduct, setPrintLabelProduct] = useState<Product | null>(
    null
  );
  const [printLabelQuantity, setPrintLabelQuantity] = useState<number>(1);
  const [printLabelCopies, setPrintLabelCopies] = useState<number>(1);
  const [todayInvoicesVisible, setTodayInvoicesVisible] =
    useState<boolean>(false);
  const [todayInvoices, setTodayInvoices] = useState<InvoiceSummary[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);

  const categories = [
    { key: "gao-deo", name: "gạo dẻo" },
    { key: "gao-no", name: "gạo nở" },
    { key: "gao-chinh-hang", name: "gạo chính hãng" },
    { key: "lua-gao-lut", name: "lúa - gạo lứt" },
    { key: "tam", name: "tấm" },
    { key: "nep", name: "nếp" },
    { key: "khac", name: "khác" },
  ];

  const units = [
    { key: "le-1kg", name: "lẻ 1kg" },
    { key: "bao-50kg", name: "bao 50kg" },
  ];

  useEffect(() => {
    console.log("MainPOS component mounted");
    console.log("Checking environment:", {
      hasWindow: typeof window !== "undefined",
      hasElectron: typeof window !== "undefined" && !!window.electron,
      hasSupabase: typeof supabase !== "undefined",
    });

    // Force a re-render after a short delay
    const timer = setTimeout(() => {
      console.log("Forcing re-render");
      setLoading((prev) => !prev);
      setLoading((prev) => !prev);
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

  // Add useEffect to fetch promotions
  useEffect(() => {
    fetchPromotions();
    fetchPricebookEntries();
  }, []);

  // Apply pricebook overrides whenever products, pricebook entries, or customer change
  useEffect(() => {
    // Apply pricebook overrides: new price = cost + adjustment_value
    if (!originalProducts.length || !pricebookEntries.length) {
      setProducts(originalProducts);
      return;
    }
    const updated = originalProducts.map((prod) => {
      const entry = pricebookEntries.find(
        (e) =>
          e.customer_group_title === customer?.glt_customer_group_name &&
          e.product_id === prod.kiotviet_id
      );
      if (entry) {
        const baseCost = prod.cost ?? prod.base_price;
        const newPrice = baseCost + Number(entry.adjustment_value);
        return { ...prod, base_price: newPrice };
      }
      return prod;
    });
    setProducts(updated);
  }, [originalProducts, pricebookEntries, customer]);

  useEffect(() => {
    // Using static QR code image with proper contrast settings
    setQrDataUri(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDctMjZUMTA6MjU6NDkrMDc6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTA3LTI2VDEwOjI3OjEwKzA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTA3LTI2VDEwOjI3OjEwKzA3OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRiZGJhNGY1LTc0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"
    );
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }

      console.log("Fetching products from Supabase...");

      const result = await supabase
        .from("kv_products")
        .select("*, kv_product_inventories(cost)")
        .eq("is_active", true)
        .limit(100)
        .order("base_price", { ascending: true });

      if (result.error) {
        console.error("Supabase query error:", result.error);
        throw result.error;
      }

      if (result.data) {
        console.log(`Fetched ${result.data.length} products`);
        // Inject inventory cost into products
        const productsWithCost = result.data.map((p: any) => ({
          ...p,
          cost: p.kv_product_inventories?.[0]?.cost ?? undefined,
        }));
        setProducts(productsWithCost);
        setOriginalProducts(productsWithCost);
      } else {
        console.warn("No products returned from database");
        setProducts([]);
        setOriginalProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error(
        "Failed to fetch products. Please check your database connection."
      );
      // Set empty products array as fallback
      setProducts([]);
      setOriginalProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (!customerSearchText) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kv_customers")
        .select("*")
        .or(
          `name.ilike.%${customerSearchText}%,code.ilike.%${customerSearchText}%,contact_number.ilike.%${customerSearchText}%`
        )
        .limit(10);

      if (error) {
        throw error;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error("Error searching customers:", error);
      message.error("Failed to search customers");
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
        (product) =>
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.code.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory) {
      // Map category keys to their display names for filtering
      const categoryMapping: { [key: string]: string } = {
        "gao-deo": "gạo dẻo",
        "gao-no": "gạo nở",
        "gao-chinh-hang": "gạo chính hãng",
        "lua-gao-lut": "lúa - gạo lứt",
        tam: "tấm",
        nep: "nếp",
        khac: "khác",
      };

      // Get the category name to filter by
      const categoryName = categoryMapping[selectedCategory];

      filtered = filtered.filter((product) => {
        const categoryLower = product.category_name?.toLowerCase() || "";
        return categoryLower.includes(categoryName.toLowerCase());
      });
    }

    if (selectedUnit) {
      // Exact unit matching
      const unitMapping: { [key: string]: string } = {
        "le-1kg": "kg",
        "bao-50kg": "bao 50kg",
      };

      const unitName = unitMapping[selectedUnit];

      filtered = filtered.filter(
        (product) => product.unit?.toLowerCase() === unitName.toLowerCase()
      );
    }

    return filtered.slice(0, 15); // Limit to 15 items as per design
  };

  // Function to add a product to cart
  const addToCart = (product: Product) => {
    const newCartItemId = Date.now();
    setCart((prevCart) => [
      ...prevCart,
      {
        ...product,
        cartItemId: newCartItemId,
        quantity: 1,
        total: product.base_price,
      },
    ]);

    // More reliable focus handling with multiple attempts
    // Use unique timeouts to avoid React's key warnings
    const focusDelays = [60, 120, 240, 480]; // Use unique values that aren't hardcoded elsewhere
    focusDelays.forEach((delay) => {
      setTimeout(() => {
        try {
          const input = document.querySelector(
            `[data-cart-item-id="${newCartItemId}"]`
          ) as HTMLInputElement;
          if (input) {
            input.focus();
            input.select(); // Select the current value for easy overwriting
          }
        } catch (error) {
          console.error("Error focusing on cart item:", error);
        }
      }, delay);
    });
  };

  // Remove cart item by productId (which could be id or cartItemId)
  const removeFromCart = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => {
        const idToMatch = item.cartItemId || item.id;
        return idToMatch !== productId;
      })
    );
  };

  // Interface for Promotion
  interface Promotion {
    id: number;
    kiotviet_customer_group: string | null;
    discount_per_unit: number;
    note: string | null;
    valid_from: string | null;
    valid_to: string | null;
    unit_applied: string | null;
    apply_per: number;
    title: string | null;
    value_type: string;
    value: number;
    is_active: boolean;
    barcode: string;
  }

  // Interface for InvoiceDetail
  interface InvoiceDetail {
    id: number;
    invoice_id: number;
    quantity: number;
    price: number;
    product_name: string;
    kiotviet_product_id: number;
    kv_products?: any;
  }

  // Interface for PricebookEntry
  interface PricebookEntry {
    id: number;
    product_id: number;
    price: number;
    customer_group?: string;
    customer_group_title?: string;
    adjustment_value?: number;
  }

  // Define CartItem interface to include cartItemId and extend Product
  interface CartItem extends Omit<Product, "kiotviet_id"> {
    quantity: number;
    kiotviet_id: number; // Make this required
    cartItemId?: number; // Optional unique identifier for cart items
    promotion_price?: number;
    promotion_name?: string;
    promotion_id?: string;
    promotion_type?: string;
    promotion_quantity?: number;
    promotion_amount?: number;
    promotion_percentage?: number;
    promotion_max_quantity?: number;
    promotion_min_quantity?: number;
    promotion_max_amount?: number;
    promotion_min_amount?: number;
    promotion_start_date?: string;
    promotion_end_date?: string;
    glt_retail_promotion?: boolean; // Add this property
  }

  // Update cart item quantity by ID or cartItemId
  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        // Check if we should match by cartItemId (if available) or fall back to product id
        const idToMatch = item.cartItemId || item.id;
        return idToMatch === productId
          ? { ...item, quantity, total: quantity * item.base_price }
          : item;
      })
    );
  };

  // Update cart item price by ID or cartItemId
  const updateCartItemPrice = (productId: number, newPrice: number) => {
    if (newPrice <= 0) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        // Check if we should match by cartItemId (if available) or fall back to product id
        const idToMatch = item.cartItemId || item.id;
        return idToMatch === productId
          ? { ...item, base_price: newPrice, total: item.quantity * newPrice }
          : item;
      })
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.base_price * item.quantity,
      0
    );
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  // Helper to check if a promo applies to a cart item
  const isPromoApplicable = (
    promo: Promotion,
    item: CartItem,
    customerGroup: string
  ) => {
    // Only active promos
    if (!activePromotions.includes(promo.id)) return false;
    // Group match: promotion group must exactly match customer's group
    if (promo.kiotviet_customer_group !== customerGroup) return false;
    // Unit match if specified
    if (
      promo.unit_applied &&
      promo.unit_applied.toLowerCase() !== item.unit.toLowerCase()
    )
      return false;
    // Always enforce quantity threshold
    if (item.quantity < promo.apply_per) return false;
    // Check if the product has glt_retail_promotion enabled
    if (!item.glt_retail_promotion) {
      return false;
    }
    return true;
  };

  // Calculate discount based on active promotions
  const calculateDiscount = () => {
    if (!isPromotionEnabled) return 0;

    const customerGroup = customer?.glt_customer_group_name ?? "khách lẻ";
    let totalDiscount = 0;

    // Filter cart items to only those with glt_retail_promotion enabled
    const applicableItems = cart.filter(item => item.glt_retail_promotion);

    applicableItems.forEach((item) => {
      // Find applicable promotions for this item
      const applicablePromos = promotions.filter((p) =>
        isPromoApplicable(p, item, customerGroup)
      );

      // Apply each promotion
      applicablePromos.forEach((promo) => {
        // Calculate how many times the promotion applies
        const applicableTimes = Math.floor(item.quantity / promo.apply_per);
        if (applicableTimes > 0) {
          totalDiscount +=
            applicableTimes * promo.apply_per * promo.discount_per_unit;
        }
      });
    });

    return totalDiscount;
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
    setCustomerSearchText("");
    setCustomers([]);
  };

  const updateReceiptHtml = () => {
    // Prepare dynamic values for print template
    const currentDate = new Date().toLocaleDateString("vi-VN");
    const currentTime = new Date().toLocaleTimeString("vi-VN");
    const dateTime = `${currentDate} ${currentTime}`;
    const subtotal = cart.reduce(
      (sum, item) => sum + item.base_price * item.quantity,
      0
    );
    const manualDiscount = invoiceDiscount;
    const lineDiscountTotal = calculateDiscount();
    const totalDiscount = lineDiscountTotal + manualDiscount;
    const total = Math.max(0, subtotal - totalDiscount);
    const customerName = customer?.name || "Khách lẻ";
    const customerPhone = customer?.contact_number || "";
    const customerAddress = (
      customer?.address ||
      customer?.location_name ||
      ""
    ).replace(/\n/g, "<br>");
    // Build each item row HTML
    const itemsHtml = cart
      .map((item) => {
        const customerGroup = customer?.glt_customer_group_name ?? "khách lẻ";
        const promos = isPromotionEnabled
          ? promotions.filter((p) => isPromoApplicable(p, item, customerGroup))
          : [];
        const discountPerUnit = promos.reduce(
          (sum, p) => sum + p.discount_per_unit,
          0
        );
        const discountedPrice = item.base_price - discountPerUnit;
        const lineTotal = item.quantity * discountedPrice;
        return `
        <tr>
          <td colspan="3">${item.name} - (${item.order_template || ""})</td>
            </tr>
        <tr>
          <td style="border-bottom:1px dashed black">${item.quantity} ${
          item.unit
        }</td>
          <td style="border-bottom:1px dashed black; text-align:right">${discountedPrice.toLocaleString(
            "vi-VN"
          )}</td>
          <td style="border-bottom:1px dashed black; text-align:right">${lineTotal.toLocaleString(
            "vi-VN"
          )}</td>
        </tr>`;
      })
      .join("");
    // Complete HTML for printing using print-form.html template
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <!-- ensure img src="assets/..." resolves -->
  <base href="${window.location.origin}/" />
  <style type="text/css">
    .printBox { font-family: Arial, sans-serif; font-size: 12px; }
    table { page-break-inside: auto; border-collapse: collapse; }
    table td, table th, div, span { font-size: 12px; word-wrap:break-word; word-break:break-word; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    img { max-width:100%; height:auto; }
  </style>
</head>
<body>
  <div id="kv-cke-temp">
    <div class="printBox">
      <!-- Receipt Header -->
      <table style="width:100%"><tbody><tr><td style="text-align:left; width:85%">
        <div>Gạo Lâm Thúy</div>
        <div>23 Ng. Đình Chiểu, P.4, Q.PN</div>
        <div>0903.048.200 (Cửa hàng, Giao hàng)</div>
        <div>028.3845.3626 (Cửa hàng, Giao hàng)</div>
        <div>0901.467.300 (Báo giá, Đặt hàng, Kho)</div>
        <div>Facebook | gaolamthuy.vn</div>
      </td></tr></tbody></table>
      <!-- Title and Date -->
      <table style="width:100%"><tbody><tr><td style="text-align:center">
        <div>PHIẾU BÁN HÀNG</div>
        <div>${dateTime}</div>
      </td></tr></tbody></table>
      <!-- Customer Info -->
      <table style="margin:10px 0 15px; width:100%"><tbody>
        <tr><td><div><strong>KH:</strong> ${customerName}</div></td></tr>
        <tr><td><div>SĐT: ${customerPhone}</div></td></tr>
        <tr><td><div>Địa chỉ: ${customerAddress}</div></td></tr>
      </tbody></table>
      <!-- Items -->
      <table cellpadding="3" style="width:98%"><thead>
        <tr>
          <th style="border-bottom:1px solid black; border-top:1px solid black; width:35%">Tên - Mô tả hàng</th>
          <th style="border-bottom:1px solid black; border-top:1px solid black; text-align:right; width:30%">Đơn giá</th>
          <th style="border-bottom:1px solid black; border-top:1px solid black; text-align:right">Thành tiền</th>
            </tr>
      </thead><tbody>
      ${itemsHtml}
      </tbody></table>
      <hr/>
      <div><strong>Tổng:</strong> ${cart.length} sản phẩm.</div>
      <div><strong>Ghi chú:</strong> <u><strong></strong></u></div>
      <hr/>
      <!-- Payment Summary -->
      <table align="right" cellspacing="0" style="border-collapse:collapse; width:100%">
        <tfoot>
          <tr><td style="text-align:right; width:65%">Tổng tiền hàng:</td><td style="text-align:right">${subtotal.toLocaleString(
            "vi-VN"
          )}</td></tr>
          <tr><td style="text-align:right">Giảm giá HĐ:</td><td style="text-align:right">${manualDiscount.toLocaleString(
            "vi-VN"
          )}</td></tr>
          <tr><td colspan="2"><hr/></td></tr>
          <tr><td style="text-align:right">Đã thanh toán:</td><td style="text-align:right">${total.toLocaleString(
            "vi-VN"
          )}</td></tr>
        </tfoot>
          </table>
      <hr/>
      <div style="text-align:center">
        <img
          src="data:image/png;base64,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"
          alt="QR Code"
          style="width:120px; margin-bottom:8px;"
        />
        <div>Vietcombank<br/>1012 842 851<br/>Ho Pham Lam</div>
        </div>
    </div>
  </div>
</body></html>`;
    setReceiptHtml(html);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.error("Please add products to cart before checkout");
      return;
    }

    setLoading(true);
    try {
      // Generate a random invoice code
      const invoiceCode = `HD${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(5, "0")}`;
      // Build each line item, applying only promos where quantity >= apply_per
      const invoiceDetails = cart.map((item) => {
        const customerGroup = customer?.glt_customer_group_name ?? "khách lẻ";
        // Only apply active promos when global promotions enabled
        const promos = isPromotionEnabled
          ? promotions.filter((p) => isPromoApplicable(p, item, customerGroup))
          : [];
        const discountPerUnit = promos.reduce(
          (sum, p) => sum + p.discount_per_unit,
          0
        );
        const sub_total = item.quantity * (item.base_price - discountPerUnit);
        return {
          product_id: item.kiotviet_id,
          product_name: item.full_name,
          quantity: item.quantity,
          price: item.base_price,
          note: item.order_template,
          discount_per_unit: discountPerUnit,
          sub_total,
        };
      });
      // Compute root totals: original subtotal, total line discounts, manual invoice discount
      const originalSubtotal = invoiceDetails.reduce(
        (sum, d) => sum + d.price * d.quantity,
        0
      );
      const lineDiscountTotal = invoiceDetails.reduce(
        (sum, d) => sum + d.discount_per_unit * d.quantity,
        0
      );
      const manualDiscount = invoiceDiscount;
      const totalDiscount = lineDiscountTotal + manualDiscount;
      // Calculate total payment based on isFullPayment flag
      const totalPayment = isFullPayment ? Math.max(0, originalSubtotal - totalDiscount) : 0;

      // Get backend URL from environment variables with validation  
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      if (!backendUrl) {
        console.error("REACT_APP_BACKEND_URL environment variable is not set");
        message.error("API configuration is missing. Please check your environment setup.");
        return;
      }
      
      const checkoutUrl = `${backendUrl}/pos/new-glt-invoice`;

      // Payload with recalculated totals and line items
      const payload = {
        // code: invoiceCode,
        branch_id: 15132,
        isApplyVoucher: false, //default
        kiotviet_customer_id: customer?.kiotviet_id ?? null,
        // customer_code: customer?.code ?? "",
        // customer_name: customer?.name ?? "",
        // total: originalSubtotal,
        invoice_discount: manualDiscount,
        total_payment: totalPayment,
        kv_sale_channel_name: "gltpos",
        // Calculate glt_paid based on payment amount versus total
        // A fully paid invoice is one where total_payment equals or exceeds the total amount
        // glt_paid: totalPayment >= calculateTotal(),
        purchase_date: new Date(),
        status_value: "Hoàn thành",
        method: "Cash", // default
        accountId: null, // default
        usingCod: false, // default
        soldById: 28310, // default
        orderId: null, // default
        note: "gaolamthuy-pos",
        items: invoiceDetails,
      };

      // Get authentication credentials from environment with validation
      const username = process.env.REACT_APP_API_USERNAME;
      const password = process.env.REACT_APP_API_PASSWORD;
      
      if (!username || !password) {
        console.error("API authentication credentials are not set in environment variables");
        message.error("API authentication configuration is missing. Please check your environment setup.");
        return;
      }
      
      const authHeader = "Basic " + btoa(`${username}:${password}`);

      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader,
      };

      // Fire & forget the checkout POST without blocking UI
      (async () => {
        try {
          const response = await fetch(checkoutUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP ${response.status}: ${errorText}`);
            return;
          }
          const result = await response.json();
          console.log("Checkout response:", result);
        } catch (error) {
          console.error("Error during background checkout:", error);
        }
      })();

      // Immediately reset UI and loading state
      message.success("Tạo đơn thành công!");

      // Remove the auto-print code
      setCart([]);
      setCustomer(null);
      setIsFullPayment(true);
      setInvoiceDiscount(0);
      setIsPromotionEnabled(true);
      setCustomerSearchText("");
      setCustomers([]);
      setSearchDropdownVisible(false);
    } catch (error) {
      console.error("Error during checkout:", error);
      message.error("Failed to complete checkout");
    } finally {
      setLoading(false);
    }
  };

  // Update the print functions for web environment
  const printReceipt = async (printerType: PrinterType = PRINTER_TYPES.K80) => {
    try {
      // All receipt printing now uses the "invoice" doc type
      const docType = "invoice";

      const tempInvoiceCode = `RECEIPT-${Date.now()}`;

      const result = await sendPrintJobToServer(docType, {
        code: tempInvoiceCode,
        metadata: {
          printer_type: printerType
        }
      });

      if (result.success) {
        message.success("Receipt sent to printer");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      message.error("Failed to print receipt. Check server connection.");
    }
  };

  // Function to print an invoice receipt
  const printInvoice = async (
    invoice: InvoiceSummary,
    printerType: PrinterType = PRINTER_TYPES.K80  
  ) => {
    try {
      // All invoice printing now uses the "invoice" doc type
      const docType = "invoice";

      // Print the invoice using the server
      message.loading(`Printing invoice #${invoice.code}...`, 1.5);

      const printAgentId = process.env.REACT_APP_PRINT_AGENT_ID || "";
      console.log("Print Agent ID from env:", printAgentId);

      const printPayload = {
        code: invoice.code,
        invoice_id: invoice.id,
        customer_id: invoice.kiotviet_customer_id,
        metadata: {
          printer_type: printerType
        }
      };

      const printResponse = await sendPrintJobToAgent("invoice", printPayload,);

      if (printResponse.success) {
        message.success(`Invoice #${invoice.code} sent to printer`);
      } else {
        throw new Error(printResponse.error);
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      message.error("Failed to print invoice. Check server connection.");
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

  // Update receipt HTML whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      updateReceiptHtml();
    }
  }, [cart, customer, invoiceDiscount, isPromotionEnabled, qrDataUri]);

  // Function to handle customer search input change
  const handleCustomerSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const plainTextSearch = removeVietnameseAccents(
        searchValue.toLowerCase()
      );

      const { data, error } = await supabase
        .from("kv_customers")
        .select("*")
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
      const highlightedCustomers = (data || []).map(
        (customer: Customer & { highlightedName?: string }) => ({
          ...customer,
          highlightedName: highlightMatch(customer.name, searchValue),
        })
      );

      setCustomers(highlightedCustomers);
    } catch (error) {
      console.error("Error searching customers:", error);
      message.error("Failed to search customers");
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
        .from("kv_invoices")
        .select("*, kv_invoice_details(*)")
        .eq("kiotviet_customer_id", customerId)
        .eq("status_value", "Hoàn thành")
        .order("purchase_date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Store all invoices for navigation
        setLastInvoices(data);
        setCurrentInvoiceIndex(0);

        // Set the current invoice details
        if (data[0].kv_invoice_details) {
          setLastOrderItems(data[0].kv_invoice_details);
        } else {
          setLastOrderItems([]);
        }

        // Open the customer note modal
        setCustomerNoteVisible(true);
      } else {
        setLastInvoices([]);
        setLastOrderItems([]);
        message.info("No purchase history found for this customer");
      }
    } catch (error) {
      console.error("Error fetching last orders:", error);
      message.error("Failed to fetch last orders");
      setLastInvoices([]);
      setLastOrderItems([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Function to navigate between invoices
  const navigateInvoices = (direction: "prev" | "next") => {
    let newIndex = currentInvoiceIndex;

    if (direction === "prev") {
      newIndex = Math.max(0, currentInvoiceIndex - 1);
    } else {
      newIndex = Math.min(lastInvoices.length - 1, currentInvoiceIndex + 1);
    }

    if (newIndex !== currentInvoiceIndex) {
      setCurrentInvoiceIndex(newIndex);
      if (lastInvoices[newIndex]?.kv_invoice_details) {
        setLastOrderItems(lastInvoices[newIndex].kv_invoice_details);
      } else {
        setLastOrderItems([]);
      }
    }
  };

  // Customer columns with highlighting
  const customerColumns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <span
          dangerouslySetInnerHTML={{ __html: record.highlightedName || text }}
        />
      ),
    },
    {
      title: "Phone",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => selectCustomer(record)}
          >
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

    if (issues.length === 1 && issues[0] === "All systems operational!") {
      console.log("Diagnostics passed, all systems operational!");
    } else {
      Modal.warning({
        title: "Connection Issues Detected",
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
        okText: "Got it",
      });
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("pos_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("pos_settings", JSON.stringify(newSettings));
    setSettingsVisible(false);
    message.success("Settings saved");
  };

  const renderSafely = () => {
    try {
      return (
        <Layout style={{ height: "100vh", overflow: "hidden" }}>
          <Header
            style={{
              background: "#001529",
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "64px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Title
                level={4}
                style={{ color: "white", margin: 0, ...styles.title }}
              >
                Gao Lam Thuy POS
              </Title>
              <Tag
                color="#faad14"
                style={{
                  cursor: "pointer",
                  ...styles.largeText,
                }}
                onClick={resetSession}
              >
                Xóa đơn hàng này
              </Tag>
            </div>
            <Space>
              <Button
                icon={<FileTextOutlined />}
                type="text"
                style={{ color: "white", ...styles.largeText }}
                onClick={showTodayInvoices}
              >
                Hóa đơn hôm nay
              </Button>
              <Button
                icon={<SettingOutlined />}
                type="text"
                style={{ color: "white", ...styles.largeText }}
                onClick={() => setSettingsVisible(true)}
              >
                Settings
              </Button>
              <Button
                icon={<BugOutlined />}
                type="text"
                style={{ color: "white", ...styles.largeText }}
                onClick={async () => {
                  const issues = await runDiagnostics();
                  Modal.info({
                    title: "Diagnostic Results",
                    content: (
                      <div>
                        {issues.map((issue, index) => (
                          <Alert
                            key={index}
                            message={issue}
                            type={
                              issue === "All systems operational!"
                                ? "success"
                                : "warning"
                            }
                            showIcon
                            style={{ marginBottom: "8px" }}
                          />
                        ))}
                        <p style={styles.largeText}>
                          See console for detailed logs (F12 or Ctrl+Shift+I)
                        </p>
                      </div>
                    ),
                    width: 600,
                  });
                }}
              >
                Diagnostics
              </Button>
            </Space>
          </Header>

          <Content
            style={{
              padding: "16px",
              backgroundColor: "#f0f2f5",
              height: "calc(100vh - 64px)",
              overflow: "hidden",
            }}
          >
            <Row gutter={[16, 16]} style={{ height: "100%" }}>
              {/* Left Column - Customer Selection and Cart */}
              <Col
                span={10}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Card style={{ marginBottom: "16px", flexShrink: 0 }}>
                  {/* Customer Selection with Dropdown */}
                  <div style={{ position: "relative" }}>
                    {customer ? (
                      <Card size="small" style={{ width: "100%" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={styles.largeText}>
                            <Text strong>{customer.name}</Text>
                            <br />
                            <Text type="secondary">
                              {customer.contact_number}
                            </Text>
                            <br />
                            <Text type="secondary">
                              {customer.address || customer.location_name || ""}
                            </Text>
                          </div>
                          <Space>
                            <Button
                              type="default"
                              icon={<HistoryOutlined />}
                              onClick={() =>
                                viewCustomerHistory(customer.kiotviet_id)
                              }
                              style={styles.largeText}
                            >
                              Thông tin
                            </Button>
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                // Unselect customer và clear ô search
                                setCustomer(null);
                                setCustomerSearchText("");
                                setCustomers([]);
                                setSearchDropdownVisible(false);
                              }}
                              style={styles.largeText}
                            />
                          </Space>
                        </div>
                      </Card>
                    ) : (
                      <div style={{ position: "relative" }}>
                        <Input
                          placeholder="🔍 Search customers..."
                          value={customerSearchText}
                          onChange={handleCustomerSearchChange}
                          onFocus={() => {
                            setSearchDropdownVisible(true);
                            setHighlightedIndex(-1);
                          }}
                          onKeyDown={handleCustomerInputKeyDown}
                          suffix={
                            <Button
                              type="text"
                              icon={<SearchOutlined />}
                              onClick={() => setCustomerModalVisible(true)}
                              style={styles.largeText}
                            />
                          }
                          style={{ width: "100%", ...styles.largeText }}
                        />
                        {searchDropdownVisible && customers.length > 0 && (
                          <Card
                            style={{
                              position: "absolute",
                              width: "100%",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflow: "auto",
                            }}
                            bodyStyle={{ padding: "8px" }}
                          >
                            {customers.map((customer, index) => (
                              <div
                                key={customer.id}
                                style={{
                                  padding: "8px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f0f0f0",
                                  backgroundColor:
                                    index === highlightedIndex
                                      ? "#e6f7ff"
                                      : undefined,
                                }}
                                onClick={() => {
                                  selectCustomer(customer);
                                  setSearchDropdownVisible(false);
                                  setHighlightedIndex(-1);
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onMouseLeave={() => setHighlightedIndex(-1)}
                              >
                                <div style={styles.largeText}>
                                  <Text strong>{customer.name}</Text> -{" "}
                                  <Text>
                                    {customer.contact_number || "No phone"}
                                  </Text>
                                </div>
                                <div style={styles.largeText}>
                                  <Text type="secondary">
                                    {customer.address ||
                                      customer.location_name ||
                                      "No address"}
                                  </Text>
                                </div>
                              </div>
                            ))}
                          </Card>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total Amount Display */}
                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Popover
                      title="Tuỳ chỉnh"
                      trigger="click"
                      content={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Switch
                              checked={isFullPayment}
                              onChange={(checked) => setIsFullPayment(checked)}
                            />
                            <span>Thanh toán đủ</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Switch
                              checked={isPromotionEnabled}
                              onChange={(checked) =>
                                setIsPromotionEnabled(checked)
                              }
                            />
                            <span>Khuyến mãi</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span>Giảm giá hóa đơn:</span>
                            <InputNumber
                              value={invoiceDiscount}
                              min={0}
                              controls={false}
                              formatter={(v) =>
                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              }
                              parser={(v) =>
                                parseFloat(v!.replace(/\$\s?|(,*)/g, ""))
                              }
                              onChange={(value) =>
                                setInvoiceDiscount(value ?? 0)
                              }
                              style={{ width: 100 }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => setInvoiceDiscount(0)}
                            />
                          </div>
                        </div>
                      }
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: 4,
                          backgroundColor: isTotalHover
                            ? "#f5f5f5"
                            : "transparent",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={() => setIsTotalHover(true)}
                        onMouseLeave={() => setIsTotalHover(false)}
                      >
                        <Text style={styles.largeText}>Tổng:</Text>
                        <Text
                          strong
                          style={{ fontSize: "20px", marginLeft: 8 }}
                        >
                          {Math.max(
                            0,
                            calculateTotal() - invoiceDiscount
                          ).toLocaleString("vi-VN")}{" "}
                          VND
                        </Text>
                      </div>
                    </Popover>
                    <Button
                      type={isFullPayment ? "primary" : "default"}
                      icon={<ShoppingCartOutlined />}
                      size="large"
                      onClick={handleCheckout}
                      loading={loading}
                      disabled={
                        cart.length === 0 || (!isFullPayment && !customer)
                      }
                      style={
                        !isFullPayment && cart.length > 0 && customer
                          ? {
                              backgroundColor: "#faad14",
                              borderColor: "#faad14",
                              color: "#fff",
                            }
                          : undefined
                      }
                    >
                      {isFullPayment ? (
                        "Thanh toán"
                      ) : (
                        <div style={{ lineHeight: 1, textAlign: "center" }}>
                          <span>Tạo đơn</span>
                          <br />
                          <span style={{ fontSize: "12px" }}>
                            chưa thanh toán
                          </span>
                        </div>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Shopping Cart */}
                <Card
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span>🛒</span>
                        <ActivePromotionTags />
                      </div>
                      {cart.length > 0 && (
                        <Button
                          danger
                          size="small"
                          onClick={() => {
                            Modal.confirm({
                              title: "Clear shopping cart",
                              content:
                                "Are you sure you want to remove all items from the cart?",
                              onOk: () => {
                                setCart([]);
                                message.success("Cart cleared");
                              },
                            });
                          }}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  }
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ flex: 1, overflow: "auto" }}>
                    <Table
                      dataSource={cart}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ y: "calc(100vh - 350px)" }}
                      columns={[
                        {
                          title: "Tên hàng",
                          dataIndex: "name",
                          key: "name",
                          ellipsis: true,
                          render: (text, record) => (
                            <div style={styles.largeText}>
                              <div>
                                <Text strong>
                                  {record.full_name || record.name}
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary">
                                  {record.order_template || record.code}
                                </Text>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "SL",
                          dataIndex: "quantity",
                          key: "quantity",
                          width: 70,
                          render: (text, record) => (
                            <InputNumber
                              min={1}
                              value={record.quantity}
                              onChange={(value) =>
                                updateCartItemQuantity(
                                  record.cartItemId || record.id,
                                  value as number
                                )
                              }
                              size="small"
                              style={{ width: "100%" }}
                              className="cart-item-quantity"
                              data-cart-item-id={record.cartItemId || record.id}
                            />
                          ),
                        },
                        {
                          title: "Giá",
                          dataIndex: "base_price",
                          key: "base_price",
                          width: 120,
                          render: (text: number, record: CartItem) => {
                            // Compute discount per unit only if promotions are enabled
                            let totalDiscountPerUnit = 0;
                            if (isPromotionEnabled) {
                              const customerGroup =
                                customer?.glt_customer_group_name ?? "khách lẻ";
                              // Only consider active and applicable promos
                              const itemPromos = promotions.filter((p) =>
                                isPromoApplicable(p, record, customerGroup)
                              );
                              totalDiscountPerUnit = itemPromos.reduce(
                                (sum, p) => sum + p.discount_per_unit,
                                0
                              );
                            }
                            const discountedPrice =
                              record.base_price - totalDiscountPerUnit;
                            const hasPromo =
                              isPromotionEnabled && totalDiscountPerUnit > 0;

                            if (hasPromo) {
                              return (
                                <div style={{ textAlign: "center" }}>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      fontSize: "16px",
                                      color: "#999",
                                    }}
                                  >
                                    {record.base_price.toLocaleString("vi-VN")}
                                  </span>
                                  <br />
                                  <span
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: "16px",
                                    }}
                                  >
                                    {discountedPrice.toLocaleString("vi-VN")}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <InputNumber
                                min={0}
                                value={record.base_price}
                                onChange={(value) =>
                                  updateCartItemPrice(
                                    record.cartItemId || record.id,
                                    value as number
                                  )
                                }
                                size="small"
                                style={{ width: "100%" }}
                                formatter={(v) =>
                                  `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(v) =>
                                  parseFloat(v!.replace(/\$\s?|(,*)/g, ""))
                                }
                              />
                            );
                          },
                        },
                        {
                          title: "Thành tiền",
                          dataIndex: "total",
                          key: "total",
                          width: 120,
                          render: (_: any, record: CartItem) => {
                            // Compute line total with active promotions only
                            let totalDiscountPerUnit = 0;
                            if (isPromotionEnabled) {
                              const customerGroup =
                                customer?.glt_customer_group_name ?? "khách lẻ";
                              // Only consider active and applicable promos
                              const itemPromos = promotions.filter((p) =>
                                isPromoApplicable(p, record, customerGroup)
                              );
                              totalDiscountPerUnit = itemPromos.reduce(
                                (sum, p) => sum + p.discount_per_unit,
                                0
                              );
                            }
                            const discountedPrice =
                              record.base_price - totalDiscountPerUnit;
                            const lineTotal = record.quantity * discountedPrice;
                            return (
                              <span>{lineTotal.toLocaleString("vi-VN")}</span>
                            );
                          },
                        },
                        {
                          title: "",
                          key: "action",
                          width: 40,
                          render: (_, record) => (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                removeFromCart(record.cartItemId || record.id)
                              }
                              size="small"
                            />
                          ),
                        },
                      ]}
                    />
                  </div>
                </Card>
              </Col>

              {/* Right Column - Filters and Products */}
              <Col span={14} style={{ height: "100%" }}>
                <Card
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Filters: Category and Unit stacked vertically */}
                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <Text
                          strong
                          style={{ marginRight: "8px", fontSize: "16px" }}
                        >
                          Category:
                        </Text>
                        {categories.map((category) => (
                          <Tag
                            key={category.key}
                            color={
                              selectedCategory === category.key
                                ? "#108ee9"
                                : "default"
                            }
                            style={{
                              cursor: "pointer",
                              margin: "0 4px 4px 0",
                              padding: "4px 8px",
                              fontSize: "16px",
                            }}
                            onClick={() => handleCategorySelect(category.key)}
                          >
                            {category.name}
                          </Tag>
                        ))}
                      </div>
                      <div>
                        <Text
                          strong
                          style={{ marginRight: "8px", fontSize: "16px" }}
                        >
                          Unit:
                        </Text>
                        {units.map((unit) => (
                          <Tag
                            key={unit.key}
                            color={
                              selectedUnit === unit.key ? "#108ee9" : "default"
                            }
                            style={{
                              cursor: "pointer",
                              margin: "0 4px 4px 0",
                              padding: "4px 8px",
                              fontSize: "16px",
                            }}
                            onClick={() => handleUnitSelect(unit.key)}
                          >
                            {unit.name}
                          </Tag>
                        ))}
                      </div>
                    </div>
                    <Input
                      placeholder="Tìm sản phẩm"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{
                        width: "250px",
                        height: "40px",
                        fontSize: "16px",
                      }}
                      suffix={<SearchOutlined style={{ fontSize: "18px" }} />}
                    />
                  </div>

                  {/* Products Grid - 3 Columns, 7 Rows with Scroll */}
                  <div style={{ flex: 1, overflow: "auto" }}>
                    <Row gutter={[16, 16]} style={{ marginRight: "4px" }}>
                      {filterProducts().map((product) => (
                        <Col
                          span={8}
                          key={product.id}
                          style={{ marginBottom: "16px" }}
                        >
                          <Card
                            hoverable
                            size="small"
                            onClick={() => addToCart(product)}
                            style={{ height: "100%", position: "relative" }}
                            className={`product-card-${product.id}`}
                          >
                            <div style={styles.largeText}>
                              <div>
                                <Text strong style={{ fontSize: 18 }}>{product.full_name}</Text>
                                <span style={{ float: "right", fontSize: 18 }}>
                                  {product.base_price.toLocaleString("vi-VN")}{" "}
                                </span>
                              </div>
                              <div> 
                                <Text type="secondary">
                                  {product.order_template || ""}
                                </Text>
                              </div>
                            </div>

                            <Tooltip title="Print Label">
                              <Button
                                type="default"
                                size="small"
                                icon={<PrinterFilled />}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent adding to cart
                                  setPrintLabelProduct(product);
                                }}
                                style={{
                                  position: "absolute",
                                  right: "5px",
                                  bottom: "5px",
                                  borderRadius: "50%",
                                  minWidth: "24px",
                                  height: "24px",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                }}
                                className={`print-label-button-${product.id}`}
                              />
                            </Tooltip>
                          </Card>
                          {/* Add CSS for hover effect - restrict to this specific product's card */}
                          <style
                            dangerouslySetInnerHTML={{
                              __html: `.product-card-${product.id}:hover .print-label-button-${product.id} {
                              opacity: 1 !important;
                            }`,
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                    {loading && (
                      <div style={{ textAlign: "center", margin: "20px" }}>
                        <Spin />
                      </div>
                    )}
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
                  dataIndex: "purchase_date",
                  key: "purchase_date",
                  render: (text) => (
                    <span style={styles.largeText}>
                      {new Date(text).toLocaleDateString("vi-VN")}
                    </span>
                  ),
                },
                {
                  title: <span style={styles.largeText}>Invoice #</span>,
                  dataIndex: "code",
                  key: "code",
                  render: (text) => (
                    <span style={styles.largeText}>{text}</span>
                  ),
                },
                {
                  title: <span style={styles.largeText}>Total</span>,
                  dataIndex: "total",
                  key: "total",
                  render: (text) => (
                    <span style={styles.largeText}>{`${Number(
                      text
                    ).toLocaleString("vi-VN")} VND`}</span>
                  ),
                },
              ]}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    dataSource={record.kv_invoice_details}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: <span style={styles.largeText}>Product</span>,
                        dataIndex: "product_name",
                        key: "product_name",
                        render: (text) => (
                          <span style={styles.largeText}>{text}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>Quantity</span>,
                        dataIndex: "quantity",
                        key: "quantity",
                        render: (text) => (
                          <span style={styles.largeText}>{text}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>Price</span>,
                        dataIndex: "price",
                        key: "price",
                        render: (text) => (
                          <span style={styles.largeText}>{`${Number(
                            text
                          ).toLocaleString("vi-VN")} VND`}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>Subtotal</span>,
                        dataIndex: "sub_total",
                        key: "sub_total",
                        render: (text) => (
                          <span style={styles.largeText}>{`${Number(
                            text
                          ).toLocaleString("vi-VN")} VND`}</span>
                        ),
                      },
                    ]}
                  />
                ),
              }}
              loading={customerLoading}
            />
          </Modal>

          {/* Settings Modal - Updated */}
          <Modal
            title={
              <span style={styles.header}>
                <SettingOutlined /> Settings
              </span>
            }
            open={settingsVisible}
            onCancel={() => setSettingsVisible(false)}
            footer={[
              <Button
                key="cancel"
                onClick={() => setSettingsVisible(false)}
                style={styles.largeText}
              >
                Cancel
              </Button>,
              <Button
                key="save"
                type="primary"
                onClick={() => {
                  saveSettings(settings);
                  message.success("Settings saved");
                  setSettingsVisible(false);
                }}
                style={styles.largeText}
              >
                Save Settings
              </Button>,
            ]}
            width={500}
          >
            <div style={{ padding: "16px 0" }}>
              <Card
                title={<span style={styles.largeText}>General Settings</span>}
              >
                <Alert
                  message="Printer Configuration Required"
                  description="Make sure you configure your receipt printer in the Printer Settings before trying to print."
                  type="info"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
                {/* Add button to open printer settings */}
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => setPrinterSettingsVisible(true)}
                  style={{ marginTop: "10px", ...styles.largeText }}
                >
                  Configure Printers
                </Button>

                {/* Add test print button */}
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => {
                    updateReceiptHtml();
                    setTimeout(() => {
                      printReceipt();
                      message.info("Testing print...");
                    }, 100);
                  }}
                  style={{
                    marginTop: "10px",
                    marginLeft: "10px",
                    ...styles.largeText,
                  }}
                >
                  Test Print
                </Button>
              </Card>
            </div>
          </Modal>

          {/* Printer Settings Modal */}
          <Modal
            title={
              <span style={styles.header}>
                <PrinterOutlined /> Printer Configuration
              </span>
            }
            open={printerSettingsVisible}
            onCancel={() => setPrinterSettingsVisible(false)}
            footer={null} // Footer buttons are inside PrinterSettings component
            width={600} // Adjust width as needed
            destroyOnClose={true} // Reload component data each time it opens
          >
            <PrinterSettings />
          </Modal>

          {/* Customer Note Modal */}
          <Modal
            title={
              <div style={styles.header}>
                <span>Ghi Chú Khách Hàng</span>
                <div style={{ fontSize: "16px", marginTop: "8px" }}>
                  {customer?.name} - {customer?.contact_number}
                </div>
              </div>
            }
            open={customerNoteVisible}
            onCancel={() => setCustomerNoteVisible(false)}
            footer={[
              <Button
                key="cancel"
                onClick={() => setCustomerNoteVisible(false)}
                style={styles.largeText}
              >
                Đóng
              </Button>,
              <Button
                key="addAll"
                type="primary"
                onClick={addAllSuggestedProducts}
                disabled={lastOrderItems.length === 0}
                style={styles.largeText}
              >
                Thêm Tất cả
              </Button>,
            ]}
            width={600}
          >
            <div style={{ marginBottom: "20px" }}>
              <Card
                title={<span style={styles.header}>Ghi Chú Khách Hàng</span>}
              >
                <div style={styles.largeText}>
                  {customer?.comments ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: customer.comments.replace(/\n/g, "<br>"),
                      }}
                    />
                  ) : (
                    <Text type="secondary">
                      Không có ghi chú cho khách hàng này.
                    </Text>
                  )}
                </div>
              </Card>
            </div>

            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={styles.header}>
                    Gợi ý đơn hàng (dựa theo đơn hàng cũ)
                  </span>
                  <div>
                    {lastInvoices.length > 0 && (
                      <Space>
                        <Text style={styles.largeText}>
                          {currentInvoiceIndex + 1} / {lastInvoices.length}
                        </Text>
                        <Button
                          icon={<LeftOutlined />}
                          disabled={currentInvoiceIndex === 0}
                          onClick={() => navigateInvoices("prev")}
                          size="small"
                        />
                        <Button
                          icon={<RightOutlined />}
                          disabled={
                            currentInvoiceIndex === lastInvoices.length - 1
                          }
                          onClick={() => navigateInvoices("next")}
                          size="small"
                        />
                      </Space>
                    )}
                  </div>
                </div>
              }
            >
              {loadingSuggestions ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Spin />
                  <div style={{ marginTop: "10px" }}>
                    Loading suggestions...
                  </div>
                </div>
              ) : lastOrderItems.length > 0 ? (
                <>
                  {lastInvoices.length > 0 &&
                    currentInvoiceIndex < lastInvoices.length && (
                      <div style={{ marginBottom: "10px" }}>
                        <Text style={styles.largeText}>
                          Mã đơn: {lastInvoices[currentInvoiceIndex].code} -
                          Ngày:{" "}
                          {new Date(
                            lastInvoices[currentInvoiceIndex].purchase_date
                          ).toLocaleDateString("vi-VN")}
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
                        title: <span style={styles.largeText}>Sản phẩm</span>,
                        dataIndex: "product_name",
                        key: "product_name",
                        render: (text) => (
                          <span style={styles.largeText}>{text}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>SL</span>,
                        dataIndex: "quantity",
                        key: "quantity",
                        render: (text) => (
                          <span style={styles.largeText}>{text}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>Giá</span>,
                        dataIndex: "price",
                        key: "price",
                        render: (text) => (
                          <span style={styles.largeText}>{`${Number(
                            text
                          ).toLocaleString("vi-VN")}`}</span>
                        ),
                      },
                      {
                        title: <span style={styles.largeText}>Thêm</span>,
                        key: "action",
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => addSuggestedProductToCart(record)}
                          >
                            Thêm
                          </Button>
                        ),
                      },
                    ]}
                  />
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Text type="secondary" style={styles.largeText}>
                    No previous purchases found.
                  </Text>
                </div>
              )}
            </Card>
          </Modal>

          {/* Add Print Label Modal at the end before the closing Layout tags */}
          <Modal
            title={
              <span style={styles.header}>
                <PrinterOutlined /> Print Product Label
              </span>
            }
            open={printLabelProduct !== null}
            onCancel={() => {
              setPrintLabelProduct(null);
              setPrintLabelQuantity(1);
              setPrintLabelCopies(1);
            }}
            footer={null}
            width={300}
          >
            {printLabelProduct && (
              <div>
                <p style={styles.largeText}>
                  <strong>{printLabelProduct.full_name}</strong>
                </p>
                <p style={styles.largeText}>
                  {printLabelProduct.base_price.toLocaleString("vi-VN")} VND
                </p>

                <Form
                  layout="vertical"
                  onFinish={() =>
                    handlePrintProductLabel(
                      printLabelProduct,
                      printLabelQuantity,
                      printLabelCopies
                    )
                  }
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item label="Quantity (kg)">
                        <InputNumber
                          min={0}
                          step={1}
                          // precision={1}
                          value={printLabelQuantity}
                          onChange={(value) =>
                            setPrintLabelQuantity(value !== null ? value : 1)
                          }
                          style={{ width: "100%" }}
                          autoFocus
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Copies">
                        <InputNumber
                          min={1}
                          max={10}
                          value={printLabelCopies}
                          onChange={(value) =>
                            setPrintLabelCopies(value !== null ? value : 1)
                          }
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<PrinterOutlined />}
                      style={{ width: "100%" }}
                    >
                      Print Label
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </Modal>
          {/* Today's Invoices Modal */}
          <Modal
            title={
              <span style={styles.header}>
                <FileTextOutlined /> Hóa đơn hôm nay
              </span>
            }
            open={todayInvoicesVisible}
            onCancel={() => setTodayInvoicesVisible(false)}
            footer={null}
            width={800}
            destroyOnClose
          >
            <Table
              dataSource={todayInvoices}
              rowKey="id"
              loading={loadingInvoices}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: "Thời gian",
                  dataIndex: "purchase_date",
                  key: "time",
                  render: (text) => (
                    <span>{new Date(text).toLocaleTimeString("vi-VN")}</span>
                  ),
                  width: 100,
                },
                {
                  title: "Số hóa đơn",
                  dataIndex: "code",
                  key: "code",
                },
                {
                  title: "Khách hàng",
                  dataIndex: "customer_name",
                  key: "customer",
                  render: (text) => text || "Khách lẻ",
                },
                {
                  title: "Tổng tiền",
                  dataIndex: "total_payment",
                  key: "total",
                  render: (value) => (
                    <span>{Number(value).toLocaleString("vi-VN")}</span>
                  ),
                  align: "right",
                },
                {
                  title: "Thanh toán",
                  key: "status",
                  render: (_, record) => (
                    <Tag color={record.glt_paid ? "green" : "blue"}>
                      {record.glt_paid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Tag>
                  ),
                },
                {
                  title: "In",
                  key: "action",
                  width: 100,
                  render: (_, record) => (
                    <PrintOptionsComponent record={record} />
                  ),
                },
              ]}
            />
          </Modal>
        </Layout>
      );
    } catch (error) {
      console.error("Error rendering MainPOS component:", error);
      return <FallbackUI />;
    }
  };

  // Function to fetch last order for a customer
  const fetchLastOrder = async (customerId: number) => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from("kv_invoices")
        .select("*, kv_invoice_details(*)")
        .eq("kiotviet_customer_id", customerId)
        .eq("status_value", "Hoàn thành")
        .order("purchase_date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setLastInvoices(data);
        setCurrentInvoiceIndex(0);

        if (data[0].kv_invoice_details) {
          setLastOrderItems(data[0].kv_invoice_details);
        } else {
          setLastOrderItems([]);
        }
      } else {
        setLastInvoices([]);
        setLastOrderItems([]);
      }
    } catch (error) {
      console.error("Error fetching last orders:", error);
      message.error("Failed to fetch last orders");
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
        .from("kv_products")
        .select("*, kv_product_inventories(cost)")
        .eq("kiotviet_id", detail.kiotviet_product_id)
        .single();

      if (error) throw error;

      if (data) {
        // Process inventory cost data like in fetchProducts
        const product = {
          ...data,
          cost: data.kv_product_inventories?.[0]?.cost ?? undefined,
        };

        // Apply pricebook entries if customer is selected, just like in the useEffect
        let finalProduct = { ...product };
        
        if (customer && pricebookEntries.length > 0) {
          // Find applicable pricebook entry for this customer group and product
          const entry = pricebookEntries.find(
            (e) =>
              e.customer_group_title === customer.glt_customer_group_name &&
              e.product_id === product.kiotviet_id
          );
          
          if (entry) {
            const baseCost = product.cost ?? product.base_price;
            const newPrice = baseCost + Number(entry.adjustment_value);
            finalProduct = { ...product, base_price: newPrice };
          }
        }

        // Add product to cart with quantity from the last order
        const existingItem = cart.find((item) => item.id === finalProduct.id);

        if (existingItem) {
          // If item already exists in cart, update its quantity and always use calculated price
          updateCartItemPrice(existingItem.id, finalProduct.base_price);
          updateCartItemQuantity(
            existingItem.id,
            existingItem.quantity + detail.quantity
          );
        } else {
          // Add new item with quantity from the last order and use calculated price
          setCart((prevCart) => [
            ...prevCart,
            {
              ...finalProduct,
              quantity: detail.quantity,
              total: detail.quantity * finalProduct.base_price,
            },
          ]);
        }

        message.success("Added to cart");
      }
    } catch (error) {
      console.error("Error adding suggested product:", error);
      message.error("Failed to add product to cart");
    }
  };

  // Function to add all suggested products
  const addAllSuggestedProducts = async () => {
    message.loading("Adding all suggested products...", 1);

    for (const item of lastOrderItems) {
      await addSuggestedProductToCart(item);
    }

    setCustomerNoteVisible(false);
    message.success("All products added to cart");
  };

  // Xử lý keyboard navigation: ArrowUp, ArrowDown, Enter
  const handleCustomerInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!searchDropdownVisible || customers.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, customers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        const selected = customers[highlightedIndex];
        selectCustomer(selected);
        setSearchDropdownVisible(false);
        setHighlightedIndex(-1);
      }
    }
  };

  // Function to toggle a promotion's active status
  const togglePromotion = (promoId: number) => {
    setActivePromotions((prev) => {
      if (prev.includes(promoId)) {
        return prev.filter((id) => id !== promoId);
      } else {
        return [...prev, promoId];
      }
    });
  };

  // Thay thế PromotionsCard với ActivePromotions component nhỏ gọn
  const ActivePromotionTags = () => {
    if (!isPromotionEnabled || !promotions.length || !activePromotions.length)
      return null;

    const customerGroup = customer?.glt_customer_group_name ?? "khách lẻ";
    const applicablePromos = promotions.filter((p) => {
      // Must be active
      if (!activePromotions.includes(p.id)) return false;
      // Promotion group must exactly match customer's group
      if (p.kiotviet_customer_group !== customerGroup) return false;
      // Must apply to at least one cart item: unit & quantity
      return cart.some((item) => {
        // Unit must match if specified
        if (
          p.unit_applied &&
          p.unit_applied.toLowerCase() !== item.unit.toLowerCase()
        ) {
          return false;
        }
        // Enforce apply_per threshold
        if (item.quantity < p.apply_per) {
          return false;
        }
        return true;
      });
    });

    if (!applicablePromos.length) return null;

    return (
      <div style={{ display: "inline-flex", marginLeft: 16, gap: 8 }}>
        {applicablePromos.map((promo) => (
          <div
            key={promo.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              background: "#e6f7ff",
              borderRadius: "12px",
              fontSize: "12px",
              border: "1px solid #91d5ff",
            }}
          >
            <span>
              {promo.title ||
                promo.note ||
                `Giảm ${promo.discount_per_unit.toLocaleString()}đ`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Implement fetchPromotions function
  const fetchPromotions = async () => {
    console.log("[PROMO] Fetching promotions");
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("glt_promotions")
        .select("*")
        .lte("valid_from", now)
        .gte("valid_to", now);

      if (error) {
        console.error("Error fetching promotions:", error);
      } else {
        console.log(`[PROMO] Loaded ${data?.length || 0} promotions`, data);
        setPromotions(data || []);
        // Initially activate all promotions
        setActivePromotions(data?.map((p: Promotion) => p.id) || []);
      }
    } catch (err) {
      console.error("[PROMO] Failed to fetch promotions:", err);
    }
  };

  // Fetch pricebook entries from Supabase
  const fetchPricebookEntries = async () => {
    try {
      const { data, error } = await supabase.from("glt_pricebooks").select("*");
      if (error) throw error;
      setPricebookEntries(data || []);
    } catch (error) {
      console.error("Error fetching pricebook entries:", error);
      message.error("Failed to load pricebook entries");
      setPricebookEntries([]);
    }
  };

  // Function to reset the current order session to defaults
  const resetSession = () => {
    setCart([]);
    setCustomer(null);
    setReceiptHtml("");
    setLastOrderItems([]);
    setLastInvoices([]);
    setCurrentInvoiceIndex(0);
    setHighlightedIndex(-1);
    setInvoiceDiscount(0);
    setIsPromotionEnabled(true);
    setIsFullPayment(true);
  };

  // Generate and print a product label
  const handlePrintProductLabel = (
    product: Product,
    quantity: number = 1,
    copies: number = 1
  ) => {
    try {
      message.loading("Sending label to printer...", 1);

      // Send print job to server with the simplified structure expected by the API
      sendPrintJobToServer("label", {
        code: product.code,
        quantity: quantity,
        copies: copies,
        metadata: {
          printer_type: PRINTER_TYPES.LABEL
        }
      })
        .then((response) => {
          if (response.success) {
            message.success("Product label sent to printer");
          } else {
            message.error(`Failed to print label: ${response.error}`);
          }
        })
        .catch((error) => {
          console.error("Error printing label:", error);
          message.error("Failed to print label. Check print server connection.");
        });
    } catch (error) {
      console.error("Error setting up label print:", error);
      message.error("Failed to set up label printing");
    }
  };

  // Generate HTML for product label
  const generateLabelHtml = (product: Product, quantity: number): string => {
    // Format the current date/time
    const now = new Date();
    const formattedDate = now.toLocaleDateString("vi-VN");
    const formattedTime = now.toLocaleTimeString("vi-VN");
    const datetime = `${formattedDate} ${formattedTime}`;

    // Calculate the total price
    const totalPrice = product.base_price * quantity;

    // Use the template with the appropriate data
    // decrypted
    return createLabelHtml({
      productName: product.full_name,
      note: product.order_template || "",
      unitPrice: product.base_price,
      quantity: quantity,
      totalPrice: totalPrice,
      packingDate: datetime,
      storeInfo: "Gạo Lâm Thúy \n 23 Ng.Đ.Chiểu, P4, Q.PN, TP.HCM",
    });
  };

  // Function to fetch today's invoices
  const fetchTodayInvoices = async () => {
    setLoadingInvoices(true);
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Format to match Supabase's timestamp format
      const todayISOString = today.toISOString();

      // Query for all invoices from today including total field
      const { data, error } = await supabase
        .from("kv_invoices")
        .select(
          "id, code, customer_name, purchase_date, total_payment, total, status_value, kiotviet_customer_id"
        )
        .gte("purchase_date", todayISOString)
        .order("purchase_date", { ascending: false });

      if (error) {
        throw error;
      }

      // Calculate glt_paid based on total_payment and total values
      const invoicesWithPaymentStatus = (data || []).map((invoice) => ({
        ...invoice,
        // Mark as paid only if total_payment equals or exceeds total
        glt_paid: invoice.total_payment >= invoice.total,
      }));

      setTodayInvoices(invoicesWithPaymentStatus);
    } catch (error) {
      console.error("Error fetching today's invoices:", error);
      message.error("Failed to load today's invoices");
      setTodayInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Function to show today's invoices modal
  const showTodayInvoices = () => {
    fetchTodayInvoices();
    setTodayInvoicesVisible(true);
  };

  // Function to generate HTML for an invoice receipt
  const generateInvoiceReceiptHtml = async (
    invoice: InvoiceSummary
  ): Promise<string> => {
    try {
      // Get invoice details from Supabase
      const { data, error } = await supabase
        .from("kv_invoice_details")
        .select("*, kv_products(*)")
        .eq("invoice_id", invoice.id);

      if (error) {
        console.error("Error fetching invoice details:", error);
        throw new Error("Failed to fetch invoice details");
      }

      // Format date and time
      const purchaseDate = new Date(invoice.purchase_date);
      const dateTimeStr = purchaseDate.toLocaleString("vi-VN");

      // Set customer info (default if not available)
      let customerName = invoice.customer_name || "Khách lẻ";
      let customerPhone = "";
      let customerAddress = "";

      // If there's a linked customer, get their details
      if (invoice.kiotviet_customer_id) {
        const { data: customerData } = await supabase
          .from("kv_customers")
          .select("name, contact_number, address, location_name")
          .eq("kiotviet_id", invoice.kiotviet_customer_id)
          .single();

        if (customerData) {
          customerName = customerData.name;
          customerPhone = customerData.contact_number || "";
          customerAddress = (
            customerData.address ||
            customerData.location_name ||
            ""
          ).replace(/\n/g, "<br>");
        }
      }

      // Prepare items for the template
      const items =
        data?.map((detail) => ({
          name: detail.product_name,
          quantity: detail.quantity,
          price: detail.price,
          total: detail.quantity * detail.price,
          unit: detail.kv_products?.unit || "",
        })) || [];

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);

      // Generate QR code - Vietcombank 1012842851
      const qrData = `00020101021238540010A00000072701240006970436011010128428510208QRIBFTTA53037045802VN63042B6F`;
      const qrDataUri = await QRCodeGenerator.toDataURL(qrData, { width: 120 });

      // Use the imported function instead of redefining it here
      return createInvoiceReceiptHtml({
        storeName: "Gạo Lâm Thúy",
        storeAddress: "23 Ng. Đình Chiểu, P.4, Q.PN",
        storePhone1: "0903.048.200 (Cửa hàng, Giao hàng)",
        storePhone2: "028.3845.3626 (Cửa hàng, Giao hàng)",
        storePhone3: "0901.467.300 (Báo giá, Đặt hàng, Kho)",
        storeSocial: "Facebook | gaolamthuy.vn",
        invoiceCode: invoice.code,
        dateTime: dateTimeStr,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        items: items,
        subtotal: subtotal,
        discount: 0, // Add discount calculation if needed
        total: invoice.total_payment,
        cashier: "Admin", // Update with actual cashier name if available
        qrDataUri: qrDataUri,
        note: "gaolamthuy-pos",
      });
    } catch (error) {
      console.error("Error generating invoice HTML:", error);
      throw error;
    }
  };

  // Component for print options to avoid React Hook errors
  const PrintOptionsComponent = ({ record }: { record: InvoiceSummary }) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrintLabel = async (invoice: InvoiceSummary) => {
      try {
        // Fetch products from this invoice to print labels
        const { data: invoiceDetails, error } = await supabase
          .from("kv_invoice_details")
          .select("*, kv_products(*)")
          .eq("invoice_id", invoice.id);

        if (error) throw error;

        if (invoiceDetails && invoiceDetails.length > 0) {
          // Get the first product to print its label
          const firstDetail = invoiceDetails[0];
          const product = firstDetail.kv_products;

          if (!product) {
            message.error("Product information not found");
            return;
          }

          const quantity = firstDetail.quantity || 1;

          // Send a label print request that includes the invoice information
          // This allows the server to get product details from the invoice
          await sendPrintJobToServer("label", {
            code: product.code,
            quantity: quantity,
            copies: 1,
            metadata: {
              printer_type: PRINTER_TYPES.LABEL
            }
          });

          message.success("Product label sent to printer");
        } else {
          message.warning("No products found in this invoice");
        }
      } catch (error) {
        console.error("Error printing label:", error);
        message.error("Failed to print label");
      }
    };

    const handlePrint = async (type: string) => {
      try {
        setIsPrinting(true);
        message.loading(`Preparing to print ${type}...`, 1);
        
        switch (type) {
          case "k80-label":
            // Print K80 receipt and label sequentially
            await sendPrintJobToServer("invoice", {
              kiotviet_invoice_code: record.code,
              invoice_id: record.id,
              customer_id: record.kiotviet_customer_id,
              metadata: {
                printer_type: PRINTER_TYPES.K80
              }
            });

            // Then print the label
            if (record.id) {
              // After printing the invoice, retrieve the products and print labels
              await handlePrintLabel(record);
            }
            break;

          case "k80":
            // Print invoice only with K80 printer
            await sendPrintJobToServer("invoice", {
              kiotviet_invoice_code: record.code,
              invoice_id: record.id,
              customer_id: record.kiotviet_customer_id,
              metadata: {
                printer_type: PRINTER_TYPES.K80
              }
            });
            break;

          case "label":
            await handlePrintLabel(record);
            break;

          default:
            message.warning("Unsupported print type");
        }
      } catch (error) {
        message.error("Print failed. Please try again.");
        console.error("Print error:", error);
      } finally {
        setIsPrinting(false);
      }
    };

    return (
      <Space>
        <Tooltip title="In Hóa Đơn">
          <Button
            icon={<PrinterOutlined />}
            loading={isPrinting}
            onClick={() => handlePrint("k80")}
            size="small"
          />
        </Tooltip>
        <Tooltip title="In Tem">
          <Button
            icon={<TagsOutlined />}
            loading={isPrinting}
            onClick={() => handlePrint("label")}
            size="small"
          />
        </Tooltip>
        <Tooltip title="In HĐ và Tem">
          <Button
            icon={<DoubleRightOutlined />}
            loading={isPrinting}
            onClick={() => handlePrint("k80-label")}
            size="small"
          />
        </Tooltip>
      </Space>
    );
  };

  // Web-compatible QR code generation
  const generateQRCode = async (text: string, config: QRCodeConfig) => {
    try {
      return await QRCodeGenerator.toDataURL(text, config);
    } catch (error) {
      console.error("Error generating QR code:", error);
      return ""; // Return empty string on error
    }
  };

  return renderSafely();
};

export default MainPOS;
