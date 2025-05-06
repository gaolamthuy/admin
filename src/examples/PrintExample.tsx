import React, { useState } from "react";
import { Button, message, Space, Typography, Card, Row, Col } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { printDocument } from "../services/printService";

const { Title, Text } = Typography;

// Sample receipt template
const receiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      width: 80mm;
      margin: 0;
      padding: 5mm;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .store-name {
      font-size: 18px;
      font-weight: bold;
    }
    .info {
      margin-bottom: 10px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th, .table td {
      padding: 5px;
      text-align: left;
      border-bottom: 1px dashed #ddd;
    }
    .total {
      margin-top: 10px;
      text-align: right;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">Gao Lam Thuy</div>
    <div>123 Nguyen Hue, District 1, HCMC</div>
    <div>Tel: (028) 3823 1234</div>
  </div>
  
  <div class="info">
    <div>Receipt #: INV-2023001</div>
    <div>Date: ${new Date().toLocaleDateString()}</div>
    <div>Time: ${new Date().toLocaleTimeString()}</div>
    <div>Cashier: Admin</div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Premium Rice</td>
        <td>2</td>
        <td>50,000đ</td>
        <td>100,000đ</td>
      </tr>
      <tr>
        <td>Jasmine Rice</td>
        <td>1</td>
        <td>45,000đ</td>
        <td>45,000đ</td>
      </tr>
      <tr>
        <td>Brown Rice</td>
        <td>1</td>
        <td>60,000đ</td>
        <td>60,000đ</td>
      </tr>
    </tbody>
  </table>
  
  <div class="total">
    <div>Subtotal: 205,000đ</div>
    <div>VAT (8%): 16,400đ</div>
    <div>Total: 221,400đ</div>
  </div>
  
  <div class="footer">
    <p>Thank you for shopping with Gao Lam Thuy!</p>
    <p>Please come again</p>
  </div>
</body>
</html>
`;

// Sample A4 invoice template
const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 15mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
    }
    .company-info {
      text-align: right;
    }
    .invoice-title {
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      margin: 20px 0;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .customer-info, .invoice-info {
      width: 45%;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .table th, .table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .table th {
      background-color: #f2f2f2;
    }
    .summary {
      text-align: right;
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gao Lam Thuy</div>
    <div class="company-info">
      <div>123 Nguyen Hue, District 1, HCMC</div>
      <div>Tel: (028) 3823 1234</div>
      <div>Email: info@gaolamthuy.vn</div>
      <div>Website: www.gaolamthuy.vn</div>
    </div>
  </div>
  
  <div class="invoice-title">INVOICE</div>
  
  <div class="invoice-details">
    <div class="customer-info">
      <h3>Bill To:</h3>
      <div>Customer Name: Nguyen Van A</div>
      <div>Address: 456 Le Loi, District 1, HCMC</div>
      <div>Phone: 0901234567</div>
      <div>Email: nguyenvana@email.com</div>
    </div>
    
    <div class="invoice-info">
      <h3>Invoice Details:</h3>
      <div>Invoice #: INV-2023001</div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
      <div>Due Date: ${new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString()}</div>
      <div>Payment Method: Cash</div>
    </div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Premium Rice</td>
        <td>2</td>
        <td>50,000đ</td>
        <td>100,000đ</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Jasmine Rice</td>
        <td>1</td>
        <td>45,000đ</td>
        <td>45,000đ</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Brown Rice</td>
        <td>1</td>
        <td>60,000đ</td>
        <td>60,000đ</td>
      </tr>
    </tbody>
  </table>
  
  <div class="summary">
    <div>Subtotal: 205,000đ</div>
    <div>VAT (8%): 16,400đ</div>
    <div>Total: 221,400đ</div>
  </div>
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Please pay within 7 days of receiving this invoice.</p>
  </div>
</body>
</html>
`;

// Sample label template
const labelTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Label</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      width: 74mm;
      height: 105mm;
      margin: 0;
      padding: 5mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .label-content {
      text-align: center;
    }
    .product-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .product-details {
      font-size: 14px;
      margin-bottom: 15px;
    }
    .barcode {
      font-family: 'Courier New', monospace;
      font-size: 40px;
      margin: 15px 0;
      letter-spacing: 5px;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .company {
      margin-top: 15px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="label-content">
    <div class="product-name">Jasmine Rice</div>
    <div class="product-details">Premium Quality - 5kg</div>
    <div class="barcode">*12345678*</div>
    <div class="price">45,000đ</div>
    <div class="company">Gao Lam Thuy - Made in Vietnam</div>
  </div>
</body>
</html>
`;

const PrintExample: React.FC = () => {
  const [loading, setLoading] = useState<{
    receipt: boolean;
    invoice: boolean;
    label: boolean;
  }>({
    receipt: false,
    invoice: false,
    label: false,
  });

  // Handle printing receipt
  const handlePrintReceipt = async () => {
    setLoading((prev) => ({ ...prev, receipt: true }));
    try {
      const result = await printDocument("printInvoice", receiptTemplate);
      if (!result.success) {
        message.error(`Failed to print receipt: ${result.error}`);
      } else {
        message.success("Receipt printed successfully");
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      message.error("Error printing receipt");
    } finally {
      setLoading((prev) => ({ ...prev, receipt: false }));
    }
  };

  // Handle printing invoice
  const handlePrintInvoice = async () => {
    setLoading((prev) => ({ ...prev, invoice: true }));
    try {
      const result = await printDocument("printInvoiceExtra", invoiceTemplate);
      if (!result.success) {
        message.error(`Failed to print invoice: ${result.error}`);
      } else {
        message.success("Invoice printed successfully");
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      message.error("Error printing invoice");
    } finally {
      setLoading((prev) => ({ ...prev, invoice: false }));
    }
  };

  // Handle printing label
  const handlePrintLabel = async () => {
    setLoading((prev) => ({ ...prev, label: true }));
    try {
      const result = await printDocument("printLabel", labelTemplate);
      if (!result.success) {
        message.error(`Failed to print label: ${result.error}`);
      } else {
        message.success("Label printed successfully");
      }
    } catch (error) {
      console.error("Error printing label:", error);
      message.error("Error printing label");
    } finally {
      setLoading((prev) => ({ ...prev, label: false }));
    }
  };

  return (
    <Card title="Print Functionality Example">
      <Title level={4}>Printing Examples</Title>
      <Text>
        This example demonstrates how to use the different printing functions.
        Make sure to configure your printers in the settings before trying to
        print.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col span={8}>
          <Card title="Thermal Receipt (K80)">
            <Text>Print a thermal receipt on the configured K80 printer.</Text>
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                loading={loading.receipt}
                onClick={handlePrintReceipt}
              >
                Print Receipt
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Full Invoice (A4)">
            <Text>Print a full invoice on the configured A4 printer.</Text>
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                loading={loading.invoice}
                onClick={handlePrintInvoice}
              >
                Print Invoice
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Product Label (A7)">
            <Text>Print a product label on the configured label printer.</Text>
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                loading={loading.label}
                onClick={handlePrintLabel}
              >
                Print Label
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default PrintExample;
