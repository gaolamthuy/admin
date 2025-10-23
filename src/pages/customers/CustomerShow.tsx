/**
 * Customer Show page component
 * Trang xem chi tiết khách hàng
 */
import React from "react";
import { Show, TextField, DateField, TagField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Card, Row, Col, Space } from "antd";

const { Title } = Typography;

/**
 * Customer Show component
 * Hiển thị chi tiết khách hàng
 */
export const CustomerShow: React.FC = () => {
  const { query } = useShow({ resource: "kv_customers" });
  const { data, isLoading } = query ?? ({} as any);
  const customer = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Title level={4}>Thông tin khách hàng</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div>
                <strong>ID KiotViet:</strong>
                <br />
                <TextField value={customer?.kiotviet_id} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Mã khách hàng:</strong>
                <br />
                <TextField value={customer?.code} />
              </div>
            </Col>
            <Col xs={24}>
              <div>
                <strong>Tên khách hàng:</strong>
                <br />
                <TextField value={customer?.name} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Số điện thoại:</strong>
                <br />
                <TextField value={customer?.contact_number} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Trạng thái:</strong>
                <br />
                <TagField
                  value={
                    customer?.glt_is_active ? "Hoạt động" : "Không hoạt động"
                  }
                  color={customer?.glt_is_active ? "green" : "red"}
                />
              </div>
            </Col>
            <Col xs={24}>
              <div>
                <strong>Địa chỉ:</strong>
                <br />
                <TextField value={customer?.address} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày tạo:</strong>
                <br />
                <DateField value={customer?.created_date} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày cập nhật:</strong>
                <br />
                <DateField value={customer?.modified_date} />
              </div>
            </Col>
          </Row>
        </Card>
      </Space>
    </Show>
  );
};
