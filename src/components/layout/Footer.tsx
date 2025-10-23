/**
 * Footer component cho layout
 * Component footer với thông tin copyright
 */
import React from "react";
import { Layout, Typography, Space } from "antd";

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

/**
 * Footer component
 * Hiển thị thông tin footer
 */
export const Footer: React.FC = () => {
  return (
    <AntFooter
      style={{
        textAlign: "center",
        background: "#fafafa",
        borderTop: "1px solid #f0f0f0",
        padding: "16px 24px",
      }}
    >
      <Space direction="vertical" size="small">
        <Text type="secondary">
          © 2024 GLT Admin Panel. All rights reserved.
        </Text>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Powered by Refine + Ant Design + Supabase
        </Text>
      </Space>
    </AntFooter>
  );
};
