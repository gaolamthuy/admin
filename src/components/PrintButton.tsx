import React from "react";
import { Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { getPrinterConfig, printDocument } from "../utils/printUtils";
import { PrinterConfig } from "../types/electron";

interface PrintButtonProps {
  type: keyof PrinterConfig;
  htmlContent: string;
  buttonText?: string;
  loading?: boolean;
}

const PrintButton: React.FC<PrintButtonProps> = ({
  type,
  htmlContent,
  buttonText = "In",
  loading,
}) => {
  const handleClick = async () => {
    try {
      const config = await getPrinterConfig();

      if (!config[type]) {
        alert(`Chưa cấu hình máy in cho ${type}`);
        return;
      }

      await printDocument(type, htmlContent);
    } catch (error) {
      console.error("Error checking printer config:", error);
      alert("Lỗi kiểm tra cấu hình máy in");
    }
  };

  return (
    <Button
      icon={<PrinterOutlined />}
      onClick={handleClick}
      loading={loading}
      type="primary"
      size="small"
    >
      {buttonText}
    </Button>
  );
};

export default PrintButton;
