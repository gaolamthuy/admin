/**
 * Dashboard page component
 * Trang dashboard chính với thống kê tổng quan
 */
import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Empty,
} from "antd";
import {
  ShopOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";

const { Title, Text } = Typography;

/**
 * Dashboard component
 * Hiển thị thống kê tổng quan hệ thống
 */
export const Dashboard: React.FC = () => {
  // Lấy dữ liệu thống kê
  const productsQuery = useList({
    resource: "kv_products",
    pagination: { pageSize: 1 },
  });

  const customersQuery = useList({
    resource: "kv_customers",
    pagination: { pageSize: 1 },
  });

  const invoicesQuery = useList({
    resource: "kv_invoices",
    pagination: { pageSize: 1 },
  });

  // Tính toán thống kê
  const totalProducts = productsQuery.result?.total || 0;
  const totalCustomers = customersQuery.result?.total || 0;
  const totalInvoices = invoicesQuery.result?.total || 0;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📊 Dashboard
          </Title>
          <Text type="secondary">Tổng quan hệ thống quản lý GLT</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={totalProducts}
                prefix={<ShopOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
              <Button
                type="link"
                icon={<EyeOutlined />}
                style={{ padding: 0, marginTop: 8 }}
              >
                Xem chi tiết
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={totalCustomers}
                prefix={<UserOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
              <Button
                type="link"
                icon={<EyeOutlined />}
                style={{ padding: 0, marginTop: 8 }}
              >
                Xem chi tiết
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng hóa đơn"
                value={totalInvoices}
                prefix={<FileTextOutlined style={{ color: "#fa8c16" }} />}
                valueStyle={{ color: "#fa8c16" }}
              />
              <Button
                type="link"
                icon={<EyeOutlined />}
                style={{ padding: 0, marginTop: 8 }}
              >
                Xem chi tiết
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}></Col>
        </Row>

        {/* Quick Actions */}
        <Card title="🚀 Thao tác nhanh">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thao tác nhanh nào được cấu hình"
          ></Empty>
        </Card>

        {/* Recent Activity */}
        <Card title="📈 Hoạt động gần đây">
          <Empty
            image={Empty.PRESENTED_IMAGE_DEFAULT}
            description="Chưa có hoạt động nào được ghi nhận"
          >
            <Button type="link" icon={<EyeOutlined />}>
              Xem tất cả hoạt động
            </Button>
          </Empty>
        </Card>
      </Space>
    </div>
  );
};
