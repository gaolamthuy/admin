/**
 * Utility functions for formatting data
 * Các hàm tiện ích để format dữ liệu
 */

/**
 * Format price to Vietnamese currency
 * Format giá tiền theo định dạng tiền tệ Việt Nam
 *
 * @param price - Giá tiền cần format
 * @returns Formatted price string
 */
export const formatPrice = (price?: number): string => {
  if (!price) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

/**
 * Format date to Vietnamese locale
 * Format ngày tháng theo định dạng Việt Nam
 *
 * @param date - Date string hoặc Date object
 * @returns Formatted date string
 */
export const formatDate = (date?: string | Date): string => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Generate image placeholder SVG
 * Tạo placeholder SVG cho ảnh
 *
 * @param width - Chiều rộng placeholder
 * @param height - Chiều cao placeholder
 * @param text - Text hiển thị trong placeholder
 * @returns SVG data URL
 */
export const generateImagePlaceholder = (
  width: number = 200,
  height: number = 200,
  text: string = "No image"
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#1f1f1f"/>
    <g fill="#8c8c8c" font-family="sans-serif" font-size="14" text-anchor="middle">
      <text x="${width / 2}" y="${height / 2 + 4}">${text}</text>
    </g>
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};
