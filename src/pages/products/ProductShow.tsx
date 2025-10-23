/**
 * Product Show page component
 * Trang xem chi tiết sản phẩm
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
 * Product Show component
 * Hiển thị chi tiết sản phẩm
 */
export const ProductShow: React.FC = () => {
  const { query } = useShow({ resource: "kv_products" });
  const { data, isLoading } = query ?? ({} as any);
  const product = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Title level={4}>Thông tin cơ bản</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div>
                <strong>ID KiotViet:</strong>
                <br />
                <TextField value={product?.kiotviet_id} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Mã sản phẩm:</strong>
                <br />
                <TextField value={product?.code} />
              </div>
            </Col>
            <Col xs={24}>
              <div>
                <strong>Tên sản phẩm:</strong>
                <br />
                <TextField value={product?.name} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Giá bán:</strong>
                <br />
                <NumberField
                  value={product?.base_price}
                  options={{
                    style: "currency",
                    currency: "VND",
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Trạng thái hiển thị:</strong>
                <br />
                <TagField
                  value={product?.glt_visible ? "Hiển thị" : "Ẩn"}
                  color={product?.glt_visible ? "green" : "red"}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày tạo:</strong>
                <br />
                <DateField value={product?.created_date} />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <strong>Ngày cập nhật:</strong>
                <br />
                <DateField value={product?.glt_updated_at} />
              </div>
            </Col>
          </Row>
        </Card>
      </Space>
    </Show>
  );
};
