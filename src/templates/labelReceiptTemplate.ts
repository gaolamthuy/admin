/**
 * Label receipt template generator
 * This file provides the functionality to generate label receipts for invoice products
 */
import { generateLabelHtml } from "./labelTemplate";

export const generateLabelReceiptHtml = async (
  product: any,
  quantity: number = 1
): Promise<string> => {
  // Format the current date/time
  const now = new Date();
  const formattedDate = now.toLocaleDateString("vi-VN");
  const formattedTime = now.toLocaleTimeString("vi-VN");
  const datetime = `${formattedDate} ${formattedTime}`;

  // Calculate the total price
  const totalPrice = product.price * quantity;

  // Use the template with the appropriate data
  return generateLabelHtml({
    productName: product.product_name,
    note: product.note || "",
    unitPrice: product.price,
    quantity: quantity,
    totalPrice: totalPrice,
    packingDate: datetime,
    storeInfo: "Gạo Lâm Thúy <br> 23 Ng.Đ.Chiểu, P4, Q.PN, TP.HCM",
  });
};

export default generateLabelReceiptHtml;
