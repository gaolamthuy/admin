/**
 * Product Card Component
 * Component hiển thị thông tin sản phẩm dưới dạng card với ảnh vuông
 *
 * @author GLT Admin Team
 * @version 1.0.0
 * @since 2024-12-19
 */

import React, { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Modal,
  Input,
  Row,
  Col,
  Divider,
} from "antd";
import { DashOutlined, PrinterOutlined, EditOutlined } from "@ant-design/icons";
import { useIsAdmin } from "../../hooks/usePermissions";

// ===== INTERFACE DEFINITIONS =====

/**
 * Props cho ProductCard component
 *
 * @interface ProductCardProps
 * @property {any} product - Dữ liệu sản phẩm từ database
 * @property {boolean} [loading=false] - Trạng thái loading của card
 * @property {function} [onImageError] - Callback xử lý lỗi ảnh
 * @property {string} imagePlaceholder - URL placeholder khi không có ảnh
 * @property {function} formatPrice - Function format giá tiền
 */
interface ProductCardProps {
  product: any;
  loading?: boolean;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  imagePlaceholder: string;
  formatPrice: (price?: number) => string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Lấy ảnh chính của sản phẩm từ mảng images
 * Ưu tiên images[0] làm ảnh chính
 *
 * @param {any} product - Dữ liệu sản phẩm
 * @returns {string | undefined} URL ảnh hoặc undefined
 */
const getProductImage = (product: any): string | undefined => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return undefined;
};

/**
 * Generate print URL cho n8n webhook
 * @param code - Product code
 * @param quantity - Quantity to print
 * @returns Print URL
 */
const generatePrintUrl = (code: string, quantity: number): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=label-product&code=${code}&quantity=${quantity}`;
};

/**
 * Generate priceboard URL cho n8n webhook
 * @param kiotvietId - KiotViet ID
 * @returns Priceboard URL
 */
const generatePriceboardUrl = (kiotvietId: string): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=priceboard&kiotviet_id=${kiotvietId}`;
};

// ===== PRINT MODAL COMPONENT =====

/**
 * Print Modal Component
 * Modal để chọn số lượng in với preset và input tùy chỉnh
 */
interface PrintModalProps {
  visible: boolean;
  onCancel: () => void;
  productCode: string;
  productName: string;
  kiotvietId: string;
}

const PrintModal: React.FC<PrintModalProps> = ({
  visible,
  onCancel,
  productCode,
  productName,
  kiotvietId,
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * Xử lý in với số lượng tùy chỉnh
   * @param quantity - Số lượng in
   */
  const handlePrint = async (quantity: number) => {
    setLoading(true);
    try {
      const printUrl = generatePrintUrl(productCode, quantity);
      // Mở URL trong tab mới
      window.open(printUrl, "_blank");
      onCancel(); // Đóng modal sau khi in
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý preset buttons (1kg, 2kg)
   * @param quantity - Số lượng preset
   */
  const handlePresetPrint = (quantity: number) => {
    handlePrint(quantity);
  };

  /**
   * Xử lý search input với số lượng tùy chỉnh
   */
  const handleSearch = (value: string) => {
    const quantity = parseInt(value, 10);
    if (quantity && quantity > 0 && quantity <= 100) {
      handlePrint(quantity);
    }
  };

  /**
   * Xử lý in bảng giá bán lẻ
   */
  const handlePriceboardPrint = () => {
    setLoading(true);
    try {
      const priceboardUrl = generatePriceboardUrl(kiotvietId);
      window.open(priceboardUrl, "_blank");
      onCancel(); // Đóng modal sau khi in
    } catch (error) {
      console.error("Priceboard print error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PrinterOutlined />
          <span>In nhãn sản phẩm</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>Sản phẩm: </Typography.Text>
        <Typography.Text>{productName}</Typography.Text>
        <br />
        <Typography.Text type="secondary">Mã: {productCode}</Typography.Text>
      </div>

      {/* Preset Buttons và Search Input */}
      <div>
        <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
          Nhập số Kg:
        </Typography.Text>
        <Row gutter={[8, 8]} align="middle">
          <Col>
            <Button
              type="default"
              onClick={() => handlePresetPrint(1)}
              loading={loading}
            >
              1Kg
            </Button>
          </Col>
          <Col>
            <Button
              type="default"
              onClick={() => handlePresetPrint(2)}
              loading={loading}
            >
              2Kg
            </Button>
          </Col>
          <Col flex="auto">
            <Input.Search
              placeholder="3 kg"
              onSearch={handleSearch}
              enterButton={<Button type="default" icon={<PrinterOutlined />} />}
              loading={loading}
              style={{ maxWidth: 90 }}
            />
          </Col>
        </Row>
      </div>

      {/* Divider */}
      <Divider />

      {/* Priceboard Section */}
      <div>
        <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
          In bảng giá bán lẻ:
        </Typography.Text>
        <Button
          type="default"
          onClick={handlePriceboardPrint}
          loading={loading}
          style={{ width: "100%" }}
        >
          In bảng giá bán lẻ
        </Button>
      </div>
    </Modal>
  );
};

// ===== MAIN COMPONENT =====

/**
 * ProductCard Component
 *
 * Hiển thị một card sản phẩm với:
 * - Ảnh vuông (1:1 aspect ratio) với lazy loading
 * - Tên sản phẩm với ellipsis
 * - Mã sản phẩm và ID KiotViet
 * - Giá bán với format VND
 * - Trạng thái hiển thị
 *
 * @param {ProductCardProps} props - Props của component
 * @returns {JSX.Element} Product card JSX
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  loading = false,
  onImageError,
  imagePlaceholder,
  formatPrice,
}) => {
  // Lấy ảnh chính của sản phẩm
  const img = getProductImage(product);

  // State cho print modal
  const [printModalVisible, setPrintModalVisible] = useState(false);

  // Check admin role
  const { hasRole: isAdmin } = useIsAdmin();

  return (
    <Card
      loading={loading}
      hoverable
      style={{
        height: "100%",
        borderRadius: 12,
        cursor: "default", // Loại bỏ cursor pointer
      }}
      cover={
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "100%", // Tạo aspect ratio 1:1 (vuông)
            overflow: "hidden",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            background: "#141414", // Background tối cho placeholder
          }}
        >
          {img ? (
            <img
              src={img}
              alt={product.name || "product"}
              loading="lazy" // Lazy loading để tối ưu performance
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover", // Đảm bảo ảnh fill đầy container
                display: "block",
              }}
              onError={onImageError} // Xử lý lỗi ảnh
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: 12,
              }}
            >
              <img
                src={imagePlaceholder}
                alt="placeholder"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>
      }
    >
      <Card.Meta
        title={
          <Typography.Text strong ellipsis>
            {product.full_name || "N/A"}
            {isAdmin && (
              <Button
                type="link"
                href={`/products/edit/${product.id}`}
                icon={<EditOutlined />}
                title="Chỉnh sửa sản phẩm"
              />
            )}
          </Typography.Text>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {/* Giá bán với màu cam GLT brand */}
            <Typography.Text style={{ color: "#f5a31c", fontWeight: 600 }}>
              {formatPrice(product.base_price)}
            </Typography.Text>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button
                type="primary"
                href={generatePrintUrl(
                  product.code || product.kiotviet_id?.toString() || "",
                  10
                )}
                icon={<PrinterOutlined />}
                target="_blank"
              >
                10Kg
              </Button>
              <Button
                type="default"
                href={generatePrintUrl(
                  product.code || product.kiotviet_id?.toString() || "",
                  5
                )}
                icon={<PrinterOutlined />}
                target="_blank"
              >
                5Kg
              </Button>
              <Button
                type="text"
                icon={<DashOutlined />}
                onClick={() => setPrintModalVisible(true)}
                title="In tùy chỉnh"
              ></Button>
            </div>
          </Space>
        }
      />

      {/* Print Modal */}
      <PrintModal
        visible={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        productCode={product.code || product.kiotviet_id?.toString() || ""}
        productName={product.full_name || "N/A"}
        kiotvietId={product.kiotviet_id?.toString() || ""}
      />
    </Card>
  );
};

// ===== EXPORTS =====

export default ProductCard;
