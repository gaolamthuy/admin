import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Select,
  Button,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Spin,
  Alert,
  Tabs,
  List,
  Tag,
  Space,
  Empty,
} from "antd";
import {
  PrinterOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { PrinterConfig, PrinterInfo, PrintResponse } from "../react-app-env";
import {
  getAvailablePrinters,
  getPrinterConfig,
  updatePrinterConfig,
} from "../utils/printUtils";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PrinterSettingsPage: React.FC = () => {
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    printInvoiceK80: "", // K80 thermal printer
    printInvoiceA4: "", // A4 regular printer
    printLabel: "", // Label printer
  });
  const [availablePrinters, setAvailablePrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Load printer configuration and available printers on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configResult, printersResult] = await Promise.all([
        getPrinterConfig(),
        getAvailablePrinters(),
      ]);

      setPrinterConfig(configResult);
      setAvailablePrinters(printersResult);

      // Set form values based on loaded config
      form.setFieldsValue(configResult);
    } catch (error) {
      console.error("Error loading printer settings:", error);
      message.error("Không thể tải cấu hình máy in");
    } finally {
      setLoading(false);
    }
  };

  const refreshPrinters = async () => {
    try {
      setRefreshing(true);
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);
      message.success("Đã cập nhật danh sách máy in");
    } catch (error) {
      console.error("Error refreshing printers:", error);
      message.error("Không thể cập nhật danh sách máy in");
    } finally {
      setRefreshing(false);
    }
  };

  // Save printer configuration
  const handleSave = async (values: PrinterConfig) => {
    try {
      setSaving(true);

      // Update each printer configuration
      const updatePromises = Object.entries(values).map(
        ([key, printerName]) => {
          return updatePrinterConfig(
            key as keyof PrinterConfig,
            printerName as string
          );
        }
      );

      const results = await Promise.all(updatePromises);

      // Check if any updates failed
      const failedUpdates = results.filter(
        (result: PrintResponse) => !result.success
      );
      if (failedUpdates.length > 0) {
        message.error(`Lỗi khi lưu cấu hình: ${failedUpdates[0].error}`);
      } else {
        message.success("Đã lưu cấu hình máy in thành công");
        setPrinterConfig(values);
      }
    } catch (error) {
      console.error("Error saving printer settings:", error);
      message.error("Lỗi khi lưu cấu hình máy in");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Đang tải cấu hình máy in..." size="large" />
        </div>
      </Card>
    );
  }

  const getDefaultPrinter = () => {
    const defaultPrinter = availablePrinters.find(
      (printer) => printer.isDefault
    );
    return defaultPrinter ? (
      <span>
        <CheckCircleOutlined style={{ color: "green" }} /> {defaultPrinter.name}
      </span>
    ) : (
      <Text type="secondary">Không tìm thấy máy in mặc định</Text>
    );
  };

  return (
    <div className="printer-settings-page">
      <Title level={2}>
        <PrinterOutlined /> Cấu Hình Máy In
      </Title>

      <Paragraph>
        Thiết lập các loại máy in khác nhau cho từng loại tài liệu in. Hãy đảm
        bảo máy in đã được cài đặt và kết nối với máy tính của bạn.
      </Paragraph>

      <Tabs defaultActiveKey="settings">
        <TabPane
          tab={
            <span>
              <SettingOutlined /> Cài Đặt Máy In
            </span>
          }
          key="settings"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={printerConfig}
            >
              <Alert
                message="Lưu ý về cấu hình máy in"
                description="Mỗi loại in cần được gán với một máy in cụ thể. Nếu không chọn máy in cho một loại in nhất định, tính năng đó sẽ không khả dụng trong ứng dụng."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="printInvoiceK80"
                    label="Máy in hóa đơn (K80)"
                    help="Dùng cho in hóa đơn thường. Thường là máy in nhiệt."
                  >
                    <Select
                      placeholder="Chọn máy in cho hóa đơn"
                      loading={refreshing}
                      suffixIcon={refreshing ? <LoadingOutlined /> : null}
                    >
                      <Option value="">Không sử dụng</Option>
                      {availablePrinters.map((printer) => (
                        <Option key={printer.name} value={printer.name}>
                          {printer.displayName || printer.name}
                          {printer.isDefault && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Mặc định
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="printInvoiceA4"
                    label="Máy in hóa đơn đầy đủ (A4)"
                    help="Dùng cho in hóa đơn đầy đủ. Thường là máy in laser hoặc inkjet khổ A4."
                  >
                    <Select
                      placeholder="Chọn máy in cho hóa đơn đầy đủ"
                      loading={refreshing}
                      suffixIcon={refreshing ? <LoadingOutlined /> : null}
                    >
                      <Option value="">Không sử dụng</Option>
                      {availablePrinters.map((printer) => (
                        <Option key={printer.name} value={printer.name}>
                          {printer.displayName || printer.name}
                          {printer.isDefault && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Mặc định
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="printLabel"
                    label="Máy in tem (A7)"
                    help="Dùng cho in tem sản phẩm. Thường là máy in tem chuyên dụng."
                  >
                    <Select
                      placeholder="Chọn máy in cho tem"
                      loading={refreshing}
                      suffixIcon={refreshing ? <LoadingOutlined /> : null}
                    >
                      <Option value="">Không sử dụng</Option>
                      {availablePrinters.map((printer) => (
                        <Option key={printer.name} value={printer.name}>
                          {printer.displayName || printer.name}
                          {printer.isDefault && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Mặc định
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={<CheckCircleOutlined />}
                  >
                    Lưu Cấu Hình
                  </Button>

                  <Button
                    onClick={refreshPrinters}
                    loading={refreshing}
                    icon={<ReloadOutlined />}
                  >
                    Làm Mới Danh Sách
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <PrinterOutlined /> Máy In Hiện Có
            </span>
          }
          key="printers"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  onClick={refreshPrinters}
                  loading={refreshing}
                  icon={<ReloadOutlined />}
                >
                  Làm Mới Danh Sách
                </Button>
              </Space>
            </div>

            <Divider orientation="left">Máy In Mặc Định</Divider>
            <div style={{ marginBottom: 24 }}>{getDefaultPrinter()}</div>

            <Divider orientation="left">Tất Cả Máy In</Divider>
            {availablePrinters.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={availablePrinters}
                renderItem={(printer) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<PrinterOutlined style={{ fontSize: 24 }} />}
                      title={
                        <Space>
                          {printer.displayName || printer.name}
                          {printer.isDefault && (
                            <Tag color="green">Mặc định</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div>ID: {printer.name}</div>
                          {printer.description && (
                            <div>Mô tả: {printer.description}</div>
                          )}
                          <div>
                            Trạng thái:{" "}
                            {printer.status === 0
                              ? "Sẵn sàng"
                              : "Không sẵn sàng"}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Không tìm thấy máy in nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PrinterSettingsPage;
