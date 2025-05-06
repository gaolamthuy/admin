/**
 * Invoice receipt template generator
 * This file contains the template for generating invoice receipts
 */

interface InvoiceTemplateData {
  storeName: string;
  storeAddress: string;
  storePhone1: string;
  storePhone2: string;
  storePhone3: string;
  storeSocial: string;
  invoiceCode: string;
  dateTime: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit?: string;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  cashier: string;
  qrDataUri?: string;
  note?: string;
}

/**
 * Generate HTML for an invoice receipt
 * @param data Invoice data to use in the template
 * @returns HTML string for the invoice
 */
export const generateInvoiceHtml = (data: InvoiceTemplateData): string => {
  // Format numbers with thousand separators
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("vi-VN");
  };

  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td colspan="3">${item.name}${item.unit ? ` (${item.unit})` : ""}</td>
        </tr>
        <tr>
          <td style="border-bottom:1px dashed black;">${item.quantity} ${
        item.unit || ""
      }</td>
          <td style="border-bottom:1px dashed black; text-align:right;">${formatCurrency(
            item.price
          )}</td>
          <td style="border-bottom:1px dashed black; text-align:right;">${formatCurrency(
            item.total
          )}</td>
        </tr>
      `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style type="text/css">
      @page {
        size: A5;
        margin: 10mm;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        transform: scale(0.95);
        transform-origin: top left;
      }
      .printBox {
        font-family: Arial, sans-serif;
        font-size: 12px;
        width: 100%;
        box-sizing: border-box;
        padding: 5mm;
      }
      table {
        page-break-inside: auto;
        border-collapse: collapse;
        width: 100%;
      }
      table td, table th, div, span {
        font-size: 12px;
        word-wrap: break-word;
        word-break: break-word;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      hr {
        border: none;
        border-top: 1px solid black;
        margin: 8px 0;
      }
      .qr-section {
        text-align: center;
        margin: 10px 0;
      }
      .qr-section img {
        width: 120px;
        height: 120px;
        margin-bottom: 8px;
      }
      .bank-info {
        text-align: center;
        font-size: 12px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
  <div id="kv-cke-temp">
  <div class="printBox">
  
    <!-- Receipt Header Section -->
    <table>
      <tbody>
        <tr>
          <td style="text-align:left; width:85%">
            <div>${data.storeName}</div>
            <div>${data.storeAddress}</div>
            <div>${data.storePhone1}</div>
            <div>${data.storePhone2}</div>
            <div>${data.storePhone3}</div>
            <div>${data.storeSocial}</div>
          </td>
        </tr>
      </tbody>
    </table>
  
    <!-- Receipt Title and Date -->
    <table>
      <tbody>
        <tr>
          <td style="text-align:center">
            <div><strong>PHIẾU BÁN HÀNG</strong></div>
            <div>Số: ${data.invoiceCode}</div>
            <div>${data.dateTime}</div>
            <div>NV bán: ${data.cashier}</div>
          </td>
        </tr>
      </tbody>
    </table>
  
    <!-- Customer Information -->
    <table style="margin:10px 0 15px;">
      <tbody>
        <tr><td><div><strong>KH:</strong> ${data.customerName}</div></td></tr>
        <tr><td><div>SĐT: ${data.customerPhone}</div></td></tr>
        <tr><td><div>Địa chỉ: ${data.customerAddress}</div></td></tr>
      </tbody>
    </table>
  
    <!-- Product Details -->
    <table cellpadding="3" style="width:98%">
      <thead>
        <tr>
          <th style="border-bottom:1px solid black; border-top:1px solid black; width:35%">Tên - Mô tả hàng</th>
          <th style="border-bottom:1px solid black; border-top:1px solid black; text-align:right; width:30%">Đơn giá</th>
          <th style="border-bottom:1px solid black; border-top:1px solid black; text-align:right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  
    <hr />
    <div><strong>Tổng:</strong> ${data.items.length} sản phẩm.</div>
  
    ${
      data.note
        ? `<div><strong>Ghi chú:</strong> <u><strong>${data.note}</strong></u></div>`
        : ""
    }
  
    <hr />
  
    <!-- Payment Details -->
    <table align="right" cellspacing="0">
      <tfoot>
        <tr>
          <td style="text-align:right; width:65%">Tạm tính:</td>
          <td style="text-align:right">${formatCurrency(data.subtotal)}đ</td>
        </tr>
        <tr>
          <td style="text-align:right">Giảm giá hóa đơn:</td>
          <td style="text-align:right">${formatCurrency(data.discount)}đ</td>
        </tr>
        <tr><td colspan="2"><hr/></td></tr>
        <tr>
          <td style="text-align:right"><strong>Tổng đơn:</strong></td>
          <td style="text-align:right"><strong>${formatCurrency(
            data.total
          )}đ</strong></td>
        </tr>
      </tfoot>
    </table>

    ${
      Math.abs(data.total - data.subtotal + data.discount) < 1
        ? `<div style="clear: both; text-align: center; margin: 10px 0; padding: 5px; border: 2px dashed #28a745;">
          <span style="color: #28a745; font-weight: bold;">✅ ĐÃ THANH TOÁN ĐỦ</span>
         </div>`
        : ""
    }

    <!-- QR Code and Bank Info Section -->
    <div style="clear: both; padding-top: 20px;">
      <div class="qr-section">
        <div style="text-align:center">
          <img 
            src="${
              data.qrDataUri ||
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDctMjZUMTA6MjU6NDkrMDc6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTA3LTI2VDEwOjI3OjEwKzA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTA3LTI2VDEwOjI3OjEwKzA3OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRiZGJhNGY1LTc0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"
            }"
            alt="QR Code and Bank Info" 
            style="width:120px; height:120px; margin-bottom:8px;"
          />
        </div>
        <div class="bank-info">
          <strong>Vietcombank</strong><br/>
          1012 842 851<br/>
          Ho Pham Lam
        </div>
      </div>
    </div>

  </div>
  </div>
  </body>
  </html>
  `;
};

export default generateInvoiceHtml;
