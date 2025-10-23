/**
 * Invoice Create page component
 * Trang tạo hóa đơn mới với form
 */
import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Space, Select, Button } from "antd";

/**
 * Invoice Create component
 * Form tạo hóa đơn mới
 */
export const InvoiceCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kv_invoices",
  });

  return (
    <Create title="Tạo hóa đơn mới" saveButtonProps={saveButtonProps}>
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
          label="Mã hóa đơn"
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã hóa đơn!" }]}
        >
          <Input placeholder="Nhập mã hóa đơn" />
        </Form.Item>

        <Form.Item
          label="Tên khách hàng"
          name="customer_name"
          rules={[{ required: true, message: "Vui lòng nhập tên khách hàng!" }]}
        >
          <Input placeholder="Nhập tên khách hàng" />
        </Form.Item>

        <Form.Item
          label="Tổng tiền"
          name="total"
          rules={[
            { required: true, message: "Vui lòng nhập tổng tiền!" },
            { type: "number", message: "Tổng tiền phải là số!" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập tổng tiền"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Select.Option value={0}>Chờ xử lý</Select.Option>
            <Select.Option value={1}>Đã xác nhận</Select.Option>
            <Select.Option value={2}>Đang giao</Select.Option>
            <Select.Option value={3}>Hoàn thành</Select.Option>
            <Select.Option value={4}>Đã hủy</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Ghi chú" name="description">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" {...saveButtonProps}>
              Tạo hóa đơn
            </Button>
            <Button href="/invoices">Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Create>
  );
};
