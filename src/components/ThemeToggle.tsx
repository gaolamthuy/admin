/**
 * Theme Toggle Button Component
 * Component nút chuyển đổi theme sáng/tối
 */
import React from "react";
import { Button, Tooltip } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Theme Toggle Button
 * Nút chuyển đổi theme với icon và tooltip
 */
export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Tooltip
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid transparent",
          transition: "all 0.2s ease",
          color: isDark ? "#f5a31c" : "#8c8c8c",
          backgroundColor: isDark
            ? "rgba(245, 163, 28, 0.1)"
            : "rgba(140, 140, 140, 0.1)",
          boxShadow: "0 0 0 0 transparent",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = isDark
            ? "0 0 0 2px #f5a31c"
            : "0 0 0 2px #8c8c8c";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
          e.currentTarget.style.transform = "scale(1)";
        }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </Tooltip>
  );
};
