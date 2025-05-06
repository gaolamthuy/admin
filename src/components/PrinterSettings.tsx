import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Form,
  Row,
  Col,
  Typography,
  Spin,
  message,
  Button,
  Space,
  Divider,
  Alert,
} from "antd";
import {
  PrinterOutlined,
  InfoCircleOutlined,
  CloudOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { PrinterConfig } from "../types/electron";
import {
  getPrinterConfig,
  updatePrinterConfig,
  printDocument,
  sendPrintJobToServer,
} from "../utils/printUtils";

const { Title, Text } = Typography;

// Environment display component
const EnvInfo = () => {
  // Display current environment variables relevant for printing
  return (
    <Card title="Environment Configuration" style={{ marginBottom: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>BACKEND_URL:</Text>{" "}
              {process.env.REACT_APP_BACKEND_URL || "(not set)"}
            </div>
            <div>
              <Text strong>API_USERNAME:</Text>{" "}
              {process.env.REACT_APP_API_USERNAME ? "****" : "(not set)"}
            </div>
            <div>
              <Text strong>API_PASSWORD:</Text>{" "}
              {process.env.REACT_APP_API_PASSWORD ? "****" : "(not set)"}
            </div>
            <div>
              <Text strong>Print API URL:</Text>{" "}
              {`${process.env.REACT_APP_BACKEND_URL || "(not set)"}/print/jobs`}
            </div>
            <Alert
              type="warning"
              message="Environment Setup Required"
              description={
                !process.env.REACT_APP_BACKEND_URL
                  ? "REACT_APP_BACKEND_URL is not set. Please set this environment variable in your .env file."
                  : "Environment variables detected."
              }
              showIcon
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// Sample HTML for test prints
const TEST_PRINTS = {
  k80: `
    <div style="font-family: monospace; width: 80mm;">
      <h3 style="text-align: center;">Test Receipt (K80)</h3>
      <p>This is a test print for the K80 thermal printer.</p>
      <p>Date: ${new Date().toLocaleString()}</p>
      <p>If you can read this clearly, your printer is working correctly.</p>
      <hr/>
      <p style="text-align: center;">*** End of Test ***</p>
    </div>
  `,
  a4: `
    <div style="padding: 20px;">
      <h2>Test Print (A4)</h2>
      <p>This is a test print for the A4 printer.</p>
      <p>Date: ${new Date().toLocaleString()}</p>
      <p>If you can read this clearly, your printer is working correctly.</p>
      <hr/>
      <p style="text-align: center;">*** End of Test ***</p>
    </div>
  `,
  label: `
    <div style="width: 100mm; padding: 10px; text-align: center;">
      <h3>Test Label</h3>
      <p>Test Print</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  `,
};

const PrinterSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [testingServer, setTestingServer] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    printInvoiceK80: "",
    printInvoiceA4: "",
    printLabel: "",
  });

  useEffect(() => {
    loadPrinterConfig();
  }, []);

  const loadPrinterConfig = async () => {
    try {
      const config = await getPrinterConfig();
      setPrinterConfig({
        printInvoiceK80: config.printInvoiceK80 || "",
        printInvoiceA4: config.printInvoiceA4 || "",
        printLabel: config.printLabel || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading printer configuration:", error);
      message.error("Failed to load printer configuration");
      setLoading(false);
    }
  };

  const handlePrinterChange = async (
    type: keyof PrinterConfig,
    value: string
  ) => {
    try {
      const response = await updatePrinterConfig(type, value);
      if (!response.success) {
        message.error("Không thể cập nhật cấu hình máy in. Vui lòng thử lại.");
        return;
      }
      message.success("Đã cập nhật cấu hình máy in thành công.");

      // Update local state
      setPrinterConfig((prev) => ({
        ...prev,
        [type]: value,
      }));
    } catch (error) {
      console.error("Error updating printer config:", error);
      message.error("Đã xảy ra lỗi khi cập nhật cấu hình máy in.");
    }
  };

  const handleTestPrint = async (type: "k80" | "a4" | "label") => {
    try {
      const printerId =
        type === "k80"
          ? "printInvoiceK80"
          : type === "a4"
          ? "printInvoiceA4"
          : "printLabel";

      if (!printerConfig[printerId]) {
        message.error(
          `Please enter a printer name for ${type.toUpperCase()} first`
        );
        return;
      }

      const testHtml = TEST_PRINTS[type];

      message.loading(`Testing ${type.toUpperCase()} printer...`, 1);
      const result = await printDocument(printerId, testHtml);

      if (result.success) {
        message.success(`Test print sent to ${type.toUpperCase()} printer`);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error(`Error testing ${type} printer:`, error);
      message.error(`Failed to test ${type.toUpperCase()} printer`);
    }
  };

  const handleTestServerPrint = async () => {
    try {
      setTestingServer(true);
      message.loading("Testing server print connection...", 1);

      const response = await sendPrintJobToServer("test-connection", {
        message: "Test connection from POS web client",
        timestamp: new Date().toISOString(),
      });

      if (response.success) {
        message.success("Server print test successful!");
      } else {
        throw new Error(response.error || "Unknown server error");
      }
    } catch (error) {
      console.error("Error testing server print:", error);
      message.error("Failed to connect to print server");
    } finally {
      setTestingServer(false);
    }
  };

  return (
    <Card>
      <Title level={4}>
        <PrinterOutlined /> Printer Settings
      </Title>

      {/* Add environment information component */}
      <EnvInfo />

      <Alert
        message="Server-Based Printing"
        description="This application uses a centralized print server to handle all printing tasks. The printer names you configure here are just for reference - the actual printing is handled by the server."
        type="info"
        showIcon
        icon={<CloudOutlined />}
        style={{ marginBottom: "20px" }}
      />

      <Button
        type="primary"
        icon={<CloudOutlined />}
        onClick={handleTestServerPrint}
        loading={testingServer}
        style={{ marginBottom: "20px" }}
      >
        Test Print Server Connection
      </Button>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item
                label="K80 Printer (Receipt)"
                help="Used for thermal receipt printing"
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    value={printerConfig.printInvoiceK80}
                    onChange={(e) =>
                      handlePrinterChange("printInvoiceK80", e.target.value)
                    }
                    placeholder="Enter K80 printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("k80")}
                    disabled={!printerConfig.printInvoiceK80}
                  >
                    Test Print
                  </Button>
                </Space>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="A4 Printer (Invoice)"
                help="Used for full-page invoice printing"
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    value={printerConfig.printInvoiceA4}
                    onChange={(e) =>
                      handlePrinterChange("printInvoiceA4", e.target.value)
                    }
                    placeholder="Enter A4 printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("a4")}
                    disabled={!printerConfig.printInvoiceA4}
                  >
                    Test Print
                  </Button>
                </Space>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Label Printer"
                help="Used for product label printing"
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    value={printerConfig.printLabel}
                    onChange={(e) =>
                      handlePrinterChange("printLabel", e.target.value)
                    }
                    placeholder="Enter label printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("label")}
                    disabled={!printerConfig.printLabel}
                  >
                    Test Print
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Card>
  );
};

export default PrinterSettings;
