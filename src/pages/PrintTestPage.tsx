import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  message,
  Divider,
  Row,
  Col,
  Select,
  Form,
} from "antd";
import { PrinterOutlined, SettingOutlined } from "@ant-design/icons";
import { PrintResponse } from "../types/electron";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Mẫu HTML đơn giản cho in hóa đơn K80
const simpleReceiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn Test</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      width: 80mm; 
      padding: 5mm;
      margin: 0;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { font-size: 18px; margin: 0; }
    .content { margin: 10px 0; }
    .footer { text-align: center; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GẠO LÂM THỦY</h1>
    <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
  </div>
  
  <div class="content">
    <p><strong>Ngày:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Thời gian:</strong> ${new Date().toLocaleTimeString()}</p>
    <p><strong>Mã HĐ:</strong> TEST-001</p>
    <hr/>
    <p><strong>Sản phẩm:</strong> Gạo Lâm Thủy</p>
    <p><strong>Số lượng:</strong> 1</p>
    <p><strong>Đơn giá:</strong> 100,000đ</p>
    <p><strong>Tổng tiền:</strong> 100,000đ</p>
  </div>
  
  <div class="footer">
    <p>Cảm ơn quý khách đã mua hàng!</p>
    <p>In thử nghiệm - Không có giá trị</p>
  </div>
</body>
</html>
`;

// Mẫu HTML đơn giản cho in hóa đơn A4
const simpleInvoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn Đầy Đủ Test</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      width: 210mm; 
      height: 297mm;
      padding: 15mm;
      margin: 0;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 24px; margin: 0; }
    .content { margin: 20px 0; }
    .footer { text-align: center; font-size: 14px; margin-top: 50px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GẠO LÂM THỦY</h1>
    <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
    <h2>HÓA ĐƠN BÁN HÀNG</h2>
  </div>
  
  <div class="content">
    <p><strong>Ngày:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Thời gian:</strong> ${new Date().toLocaleTimeString()}</p>
    <p><strong>Mã HĐ:</strong> TEST-A4-001</p>
    <p><strong>Khách hàng:</strong> Nguyễn Văn A</p>
    <hr/>
    <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Sản phẩm</th>
        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Số lượng</th>
        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Đơn giá</th>
        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Thành tiền</th>
      </tr>
      <tr>
        <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Gạo Lâm Thủy</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">1</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">100,000đ</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">100,000đ</td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tổng tiền:</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">100,000đ</td>
      </tr>
    </table>
  </div>
  
  <div class="footer">
    <p>Cảm ơn quý khách đã mua hàng!</p>
    <p>In thử nghiệm - Không có giá trị</p>
  </div>
</body>
</html>
`;

// Mẫu HTML đơn giản cho in nhãn A7
const simpleLabelTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nhãn Sản Phẩm</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      width: 74mm; 
      height: 105mm;
      padding: 5mm;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .product-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .price { font-size: 24px; font-weight: bold; margin: 15px 0; }
    .barcode { font-family: monospace; font-size: 16px; letter-spacing: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <div class="product-name">GẠO LÂM THỦY</div>
    <div>Gạo Nếp Thơm</div>
    <div>5kg</div>
    <div class="barcode">*123456789*</div>
    <div class="price">100,000đ</div>
    <div>Xuất xứ: Việt Nam</div>
    <div>HSD: ${new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toLocaleDateString()}</div>
  </div>
</body>
</html>
`;

const PrintTestPage = () => {
  const [printing, setPrinting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("receipt");

  const getTemplate = () => {
    switch (selectedTemplate) {
      case "receipt":
        return {
          type: "printInvoice",
          html: simpleReceiptTemplate,
          name: "hóa đơn K80",
        };
      case "invoice":
        return {
          type: "printInvoiceExtra",
          html: simpleInvoiceTemplate,
          name: "hóa đơn A4",
        };
      case "label":
        return {
          type: "printLabel",
          html: simpleLabelTemplate,
          name: "nhãn sản phẩm",
        };
      default:
        return {
          type: "printInvoice",
          html: simpleReceiptTemplate,
          name: "hóa đơn K80",
        };
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const template = getTemplate();

      // Nếu window.electron không tồn tại, hiển thị mẫu HTML trong tab mới
      if (!window.electron?.printer) {
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(template.html);
          newWindow.document.close();
          newWindow.focus();
          try {
            newWindow.print();
          } catch (err) {
            console.error("Lỗi khi in:", err);
          }
        }
        return;
      }

      // Gửi lệnh in đến main process
      window.electron.printer.print({
        type: template.type,
        html: template.html,
      });

      // Đăng ký nhận kết quả
      window.electron.printer.onPrintResponse((response: PrintResponse) => {
        if (response.success) {
          message.success(`Đã in ${template.name} thành công`);
        } else {
          message.error(`Lỗi in ${template.name}: ${response.error}`);
        }
        window.electron?.printer?.removeAllListeners("print-response");
      });
    } catch (err) {
      console.error("Lỗi in:", err);
      message.error("Có lỗi xảy ra khi in");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
      <Title level={2}>
        <PrinterOutlined /> Kiểm Tra In Ấn
      </Title>

      <Paragraph>
        Trang này cho phép bạn kiểm tra chức năng in ấn bằng cách in các mẫu hóa
        đơn và nhãn. Đảm bảo bạn đã cấu hình máy in trong phần cài đặt trước khi
        thử nghiệm.
      </Paragraph>

      <Alert
        message="Lưu ý"
        description={
          <div>
            <p>Để in được, bạn cần:</p>
            <ol>
              <li>Đã cài đặt máy in trong phần Cài đặt</li>
              <li>Máy in đã được kết nối và hoạt động</li>
              <li>
                Phần mềm đang chạy trong môi trường Electron (không phải trình
                duyệt web)
              </li>
            </ol>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Card>
        <Form layout="vertical">
          <Form.Item label="Chọn mẫu in">
            <Select
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              style={{ width: 300 }}
            >
              <Option value="receipt">Hóa đơn K80 (máy in nhiệt)</Option>
              <Option value="invoice">Hóa đơn A4 (máy in thường)</Option>
              <Option value="label">Nhãn sản phẩm A7 (máy in tem)</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  size="large"
                  loading={printing}
                  onClick={handlePrint}
                >
                  In Thử Nghiệm
                </Button>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: "center" }}>
                <Button
                  icon={<SettingOutlined />}
                  size="large"
                  onClick={() => {
                    // Thay đổi đường dẫn sau khi bạn tích hợp vào router
                    message.info("Chuyển đến trang cài đặt máy in");
                  }}
                >
                  Cài Đặt Máy In
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Divider />

      <Title level={4}>Mẫu In Hiện Tại:</Title>
      <Card>
        <div
          style={{
            maxHeight: "400px",
            overflow: "auto",
            border: "1px solid #eee",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
          }}
        >
          <pre style={{ whiteSpace: "pre-wrap" }}>{getTemplate().html}</pre>
        </div>
      </Card>
    </div>
  );
};

export default PrintTestPage;
