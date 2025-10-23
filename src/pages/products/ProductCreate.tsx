/**
 * Product Create page component
 * Trang tạo sản phẩm mới với form
 */
import React from "react";
import { Create } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Space, Button } from "antd";
import { useForm } from "@refinedev/core";

/**
 * Product Create component
 * Form tạo sản phẩm mới
 */
export const ProductCreate: React.FC = () => {
  const { form } = useForm({
    resource: "kv_products",
  });

  return (
    <Create title="Tạo sản phẩm mới">
      <Form {...form} layout="vertical">
        <Form.Item
          label="ID KiotViet"
          name="kiotviet_id"
          rules={[
            { required: true, message: "Vui lòng nhập ID KiotViet!" },
            { type: "number", message: "ID phải là số!" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập ID KiotViet"
          />
        </Form.Item>

        <Form.Item
          label="Mã sản phẩm"
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã sản phẩm!" }]}
        >
          <Input placeholder="Nhập mã sản phẩm" />
        </Form.Item>

        <Form.Item
          label="Tên sản phẩm"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
        >
          <Input placeholder="Nhập tên sản phẩm" />
        </Form.Item>

        <Form.Item
          label="Giá bán"
          name="base_price"
          rules={[
            { required: true, message: "Vui lòng nhập giá bán!" },
            { type: "number", message: "Giá phải là số!" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập giá bán"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Hiển thị"
          name="glt_visible"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" {...saveButtonProps}>
              Tạo sản phẩm
            </Button>
            <Button href="/products">Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Create>
  );
};
