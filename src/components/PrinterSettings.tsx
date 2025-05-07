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
  Tooltip,
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

// Environment information component with proper validation UI
const EnvInfo = () => {
  // Check if all required environment variables are set
  const isBackendUrlSet = !!process.env.REACT_APP_BACKEND_URL;
  const isApiUsernameSet = !!process.env.REACT_APP_API_USERNAME;
  const isApiPasswordSet = !!process.env.REACT_APP_API_PASSWORD;
  const isSupabaseUrlSet = !!process.env.REACT_APP_SUPABASE_URL;
  const isSupabaseKeySet = !!process.env.REACT_APP_SUPABASE_SERVICE_KEY;
  const isPrintAgentUrlSet = !!process.env.REACT_APP_PRINT_AGENT_URL;
  const isPrintAgentPortSet = !!process.env.REACT_APP_PRINT_AGENT_PORT;
  
  const allEnvVarsSet = isBackendUrlSet && isApiUsernameSet && isApiPasswordSet && 
                        isSupabaseUrlSet && isSupabaseKeySet && 
                        isPrintAgentUrlSet && isPrintAgentPortSet;
  
  return (
    <Card title="Environment Configuration" style={{ marginBottom: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>BACKEND_URL:</Text>{" "}
              {isBackendUrlSet ? process.env.REACT_APP_BACKEND_URL : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>API_USERNAME:</Text>{" "}
              {isApiUsernameSet ? "****" : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>API_PASSWORD:</Text>{" "}
              {isApiPasswordSet ? "****" : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>SUPABASE_URL:</Text>{" "}
              {isSupabaseUrlSet ? process.env.REACT_APP_SUPABASE_URL : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>SUPABASE_SERVICE_KEY:</Text>{" "}
              {isSupabaseKeySet ? "****" : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>PRINT_AGENT_URL:</Text>{" "}
              {isPrintAgentUrlSet ? process.env.REACT_APP_PRINT_AGENT_URL : <Text type="danger">(not set)</Text>}
            </div>
            <div>
              <Text strong>PRINT_AGENT_PORT:</Text>{" "}
              {isPrintAgentPortSet ? process.env.REACT_APP_PRINT_AGENT_PORT : <Text type="danger">(not set)</Text>}
            </div>
            <Alert
              type={allEnvVarsSet ? "success" : "warning"}
              message={allEnvVarsSet ? "Environment Setup Complete" : "Environment Setup Required"}
              description={
                allEnvVarsSet
                  ? "All required environment variables are set."
                  : "One or more required environment variables are missing. Please check your .env file configuration."
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

  return (
    <Card>
      <Title level={4}>
        <PrinterOutlined /> Printer Settings
      </Title>

      {/* Add environment information component */}
      <EnvInfo />

      <Alert
        message="Print Agent Configuration"
        description="This application uses a local print agent to handle all printing tasks. Make sure the print agent is running on the specified URL and port in your environment configuration."
        type="info"
        showIcon
        icon={<CloudOutlined />}
        style={{ marginBottom: "20px" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
          <p>Loading printer settings...</p>
        </div>
      ) : (
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <span>K80 Thermal Printer</span>
                    <Tooltip title="Used for receipts">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <Input.Group compact>
                  <Input
                    style={{ width: "calc(100% - 100px)" }}
                    value={printerConfig.printInvoiceK80}
                    onChange={(e) =>
                      handlePrinterChange("printInvoiceK80", e.target.value)
                    }
                    placeholder="Enter printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("k80")}
                    style={{ width: "100px" }}
                  >
                    Test Print
                  </Button>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <span>A4 Printer</span>
                    <Tooltip title="Used for full-page invoices">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <Input.Group compact>
                  <Input
                    style={{ width: "calc(100% - 100px)" }}
                    value={printerConfig.printInvoiceA4}
                    onChange={(e) =>
                      handlePrinterChange("printInvoiceA4", e.target.value)
                    }
                    placeholder="Enter printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("a4")}
                    style={{ width: "100px" }}
                  >
                    Test Print
                  </Button>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <span>Label Printer</span>
                    <Tooltip title="Used for product labels">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <Input.Group compact>
                  <Input
                    style={{ width: "calc(100% - 100px)" }}
                    value={printerConfig.printLabel}
                    onChange={(e) =>
                      handlePrinterChange("printLabel", e.target.value)
                    }
                    placeholder="Enter printer name"
                  />
                  <Button
                    type="primary"
                    onClick={() => handleTestPrint("label")}
                    style={{ width: "100px" }}
                  >
                    Test Print
                  </Button>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      <Divider />
      <Space>
        <Button type="primary" onClick={() => loadPrinterConfig()}>
          Refresh Settings
        </Button>
      </Space>
    </Card>
  );
};

export default PrinterSettings;
