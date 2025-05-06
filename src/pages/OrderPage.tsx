import React from "react";
import { Card } from "antd";
import PrintButton from "../components/PrintButton";

const OrderPage: React.FC = () => {
  // Tạo HTML content để in
  const receiptHtml = `
    <div>
      <h1>HÓA ĐƠN</h1>
      <!-- Nội dung hóa đơn -->
    </div>
  `;

  return (
    <Card title="Quản lý đơn hàng">
      {/* Các thành phần khác */}

      <div style={{ marginTop: 20 }}>
        <PrintButton
          type="printInvoiceK80"
          htmlContent={receiptHtml}
          buttonText="In hóa đơn"
        />
      </div>
    </Card>
  );
};

export default OrderPage;
