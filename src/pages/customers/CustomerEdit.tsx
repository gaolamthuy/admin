/**
 * Customer Edit page component
 * Trang chỉnh sửa khách hàng với form
 */
import React from "react";
import { Edit } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Space, Button } from "antd";
import { useForm } from "@refinedev/antd";

/**
 * Customer Edit component
 * Form chỉnh sửa khách hàng
 */
export const CustomerEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kv_customers",
  });

  return (
    <Edit title="Chỉnh sửa khách hàng" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
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
          label="Mã khách hàng"
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã khách hàng!" }]}
        >
          <Input placeholder="Nhập mã khách hàng" />
        </Form.Item>

        <Form.Item
          label="Tên khách hàng"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên khách hàng!" }]}
        >
          <Input placeholder="Nhập tên khách hàng" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="contact_number">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea placeholder="Nhập địa chỉ" rows={3} />
        </Form.Item>

        <Form.Item
          label="Trạng thái hoạt động"
          name="glt_is_active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" {...saveButtonProps}>
              Cập nhật khách hàng
            </Button>
            <Button href="/customers">Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Edit>
  );
};
