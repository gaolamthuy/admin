/**
 * Custom Header Component with Theme Toggle
 * Component header tùy chỉnh với nút chuyển đổi theme
 */
import React from "react";
import { Layout, Space, Typography } from "antd";
import { ThemeToggle } from "../ThemeToggle";
import { UserAvatar } from "./UserAvatar";

const { Header: AntHeader } = Layout;
const { Title } = Typography;

/**
 * Custom Header
 * Header tùy chỉnh với theme toggle và user avatar
 */
export const Header: React.FC = () => {
  return (
    <AntHeader
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "transparent",
        borderBottom: "1px solid #f0f0f0",
        height: "64px",
      }}
    >
      <Space direction="vertical" size={2} align="start">
        <Title
          level={4}
          style={{
            margin: 0,
            color: "#f5a31c",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
          }}
        >
          Gạo Lâm Thúy - Admin Panel
        </Title>
      </Space>

      <Space>
        <ThemeToggle />
        <UserAvatar />
      </Space>
    </AntHeader>
  );
};
