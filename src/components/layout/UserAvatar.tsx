/**
 * User Avatar Component with Dropdown
 * Component avatar user với dropdown chứa thông tin
 */
import React from "react";
import { Dropdown, Button, Typography, Space } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";

const { Text } = Typography;

/**
 * UserAvatar Component
 *
 * Avatar đơn giản với dropdown chứa:
 * - User email
 * - User name (nếu có)
 * - Logout action
 *
 * @returns JSX.Element
 */
export const UserAvatar: React.FC = () => {
  const { data: user } = useGetIdentity();
  const { mutate: logout } = useLogout();

  /**
   * Xử lý logout
   */
  const handleLogout = () => {
    logout();
  };

  /**
   * Menu items cho dropdown
   */
  const menuItems = [
    {
      key: "user-info",
      label: (
        <Space direction="vertical" size={0} style={{ padding: "8px 0" }}>
          <Text strong style={{ fontSize: "14px" }}>
            {user?.email}
          </Text>
          {user?.name && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {user.name}
            </Text>
          )}
        </Space>
      ),
      disabled: true,
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  /**
   * Lấy initial từ email
   */
  const getInitial = (email?: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      placement="bottomRight"
      arrow
    >
      <Button
        type="text"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid transparent",
          transition: "all 0.2s ease",
          backgroundColor: "#f5a31c",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          boxShadow: "0 0 0 0 transparent",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = "0 0 0 2px #f5a31c";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {getInitial(user.email)}
      </Button>
    </Dropdown>
  );
};

export default UserAvatar;
