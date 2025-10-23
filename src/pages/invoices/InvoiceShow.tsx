/**
 * Invoice Show page component
 * Trang xem chi tiết hóa đơn
 */
import React from "react";
import {
  Show,
  TextField,
  NumberField,
  DateField,
  TagField,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Card, Row, Col, Space } from "antd";

const { Title } = Typography;

/**
 * Invoice Show component
 * Hiển thị chi tiết hóa đơn
 */
export const InvoiceShow: React.FC = () => {
  const { query } = useShow({
    resource: "kv_invoices",
  });

  const { data, isLoading } = query ?? ({} as any);
  const invoice = data?.data;

  const getStatusInfo = (status: number) => {
    const statusMap = {
      0: { text: "Chờ xử lý", color: "orange" },
      1: { text: "Đã xác nhận", color: "blue" },
      2: { text: "Đang giao", color: "purple" },
      3: { text: "Hoàn thành", color: "green" },
      4: { text: "Đã hủy", color: "red" },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        text: "Không xác định",
        color: "default",
      }
    );
  };

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Title level={4}>Thông tin hóa đơn</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div>
                <strong>ID KiotViet:</strong>
                <br />
                <TextField value={invoice?.kiotviet_id} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Mã hóa đơn:</strong>
                <br />
                <TextField value={invoice?.code} />
              </div>
            </Col>
            <Col xs={24}>
              <div>
                <strong>Tên khách hàng:</strong>
                <br />
                <TextField value={invoice?.customer_name} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Tổng tiền:</strong>
                <br />
                <NumberField
                  value={invoice?.total}
                  options={{
                    style: "currency",
                    currency: "VND",
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Trạng thái:</strong>
                <br />
                <TagField
                  value={getStatusInfo(invoice?.status || 0).text}
                  color={getStatusInfo(invoice?.status || 0).color}
                />
              </div>
            </Col>
            <Col xs={24}>
              <div>
                <strong>Ghi chú:</strong>
                <br />
                <TextField value={invoice?.description} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày tạo:</strong>
                <br />
                <DateField value={invoice?.created_at} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày cập nhật:</strong>
                <br />
                <DateField value={invoice?.updated_at} />
              </div>
            </Col>
          </Row>
        </Card>
      </Space>
    </Show>
  );
};
