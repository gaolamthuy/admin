export const generateReceiptHtml = (orderData: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; width: 80mm; }
        .header { text-align: center; }
        /* Thêm các style khác */
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${orderData.storeName}</h2>
        <p>${orderData.address}</p>
      </div>
      <!-- Thêm nội dung hóa đơn -->
    </body>
    </html>
  `;
};
