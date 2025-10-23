/**
 * Custom Title Component for Sidebar
 * Component title tùy chỉnh cho sidebar với logo Gạo Lâm Thúy
 */
import React from "react";
import { Space, Image } from "antd";
import { Link } from "react-router-dom";

/**
 * Custom Title Component
 *
 * Component hiển thị logo và title trong sidebar
 * Thay thế "Refine Project" bằng branding Gạo Lâm Thúy
 *
 * @returns JSX.Element
 */
export const Title: React.FC = () => {
  return (
    <Space
      align="center"
      style={{ padding: "16px", width: "100%", justifyContent: "center" }}
    >
      <Link to="/">
        <Image
          src="/assets/logo/logo-200x200.png"
          alt="Gạo Lâm Thúy Logo"
          width={50}
          height={50}
          preview={false}
          style={{ borderRadius: "6px" }}
        />
      </Link>
    </Space>
  );
};
