/**
 * Product Edit page component
 * Trang chỉnh sửa sản phẩm với form
 */
import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, InputNumber, Switch, theme, Typography } from "antd";

/**
 * Product Edit component
 * Form chỉnh sửa sản phẩm
 */
export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kv_products",
  });

  // Get theme token for consistent styling
  const { token } = theme.useToken();

  return (
    <Edit title="Chỉnh sửa sản phẩm" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        {/* Product Information Display - Read Only */}
        <Form.Item>
          <Typography.Title
            level={3}
            style={{
              color: token.colorPrimary,
              marginBottom: "16px",
            }}
          >
            {formProps.initialValues?.full_name || "Đang tải..."}
          </Typography.Title>

          <Typography.Paragraph>
            <Typography.Text strong>Giá bán lẻ:</Typography.Text>{" "}
            {formProps.initialValues?.base_price?.toLocaleString()} VND
          </Typography.Paragraph>

          <Typography.Paragraph>
            <Typography.Text strong>Ngày cập nhật:</Typography.Text>{" "}
            {formProps.initialValues?.glt_updated_at
              ? new Date(
                  formProps.initialValues.glt_updated_at
                ).toLocaleDateString("vi-VN")
              : "Chưa có"}
          </Typography.Paragraph>
        </Form.Item>

        <Form.Item
          label="Markup Price"
          name="glt_baseprice_markup"
          rules={[
            { required: true, message: "Vui lòng nhập Markup Price!" },
            { type: "number", message: "Giá phải là số!" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập Markup Price"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Khuyến mãi"
          name="glt_retail_promotion"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
