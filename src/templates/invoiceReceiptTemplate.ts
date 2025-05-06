/**
 * Invoice receipt template generator
 * This file provides the functionality to generate invoice receipt HTML for existing orders
 */
import { generateInvoiceHtml } from "./invoiceTemplate";
import { supabase } from "../services/supabaseClient";

// Function to generate invoice receipt HTML for an existing invoice
export const generateInvoiceReceiptHtml = async (
  invoice: any
): Promise<string> => {
  // Get invoice details from Supabase
  const { data, error } = await supabase
    .from("kv_invoice_details")
    .select("*, kv_products(*)")
    .eq("invoice_id", invoice.id);

  if (error) {
    console.error("Error fetching invoice details:", error);
    throw new Error("Failed to fetch invoice details");
  }

  // Format date and time
  const purchaseDate = new Date(invoice.purchase_date);
  const dateTimeStr = purchaseDate.toLocaleString("vi-VN");

  // Set customer info (default if not available)
  let customerName = invoice.customer_name || "Khách lẻ";
  let customerPhone = "";
  let customerAddress = "";

  // If there's a linked customer, get their details
  if (invoice.kiotviet_customer_id) {
    const { data: customerData } = await supabase
      .from("kv_customers")
      .select("name, contact_number, address, location_name")
      .eq("kiotviet_id", invoice.kiotviet_customer_id)
      .single();

    if (customerData) {
      customerName = customerData.name;
      customerPhone = customerData.contact_number || "";
      customerAddress = (
        customerData.address ||
        customerData.location_name ||
        ""
      ).replace(/\n/g, "<br>");
    }
  }

  // Prepare items for the template
  const items =
    data?.map((detail) => ({
      name: detail.product_name,
      quantity: detail.quantity,
      price: detail.price,
      total: detail.quantity * detail.price,
      unit: detail.kv_products?.unit || "",
    })) || [];

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Use the template with the appropriate data
  return generateInvoiceHtml({
    storeName: "Gạo Lâm Thúy",
    storeAddress: "23 Ng. Đình Chiểu, P.4, Q.PN",
    storePhone1: "0903.048.200 (Cửa hàng, Giao hàng)",
    storePhone2: "028.3845.3626 (Cửa hàng, Giao hàng)",
    storePhone3: "0901.467.300 (Báo giá, Đặt hàng, Kho)",
    storeSocial: "Facebook | gaolamthuy.vn",
    invoiceCode: invoice.code,
    dateTime: dateTimeStr,
    customerName: customerName,
    customerPhone: customerPhone,
    customerAddress: customerAddress,
    items: items,
    subtotal: subtotal,
    discount: 0, // Add discount calculation if needed
    total: invoice.total_payment,
    cashier: "Admin", // Update with actual cashier name if available
    qrDataUri:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAABlBMVEX///8AAABVwtN+AAAB90lEQVR4nO2W0W7jMAxE9f+/vHuLprTkhJUzQHlB1waCnGbEkLbav75IJBKJRCKRSCQSiUQikUgkEolEIvmf5d4Tl/RO75Or19O3QLpn6Xwvtl5Pv0qjuS5LXZaqaQuZ106jspTTWl1KL3FLdStrmJtFqqdv3c2DtaXMY/ByVKxR27J0NU/etXb0eqvQaE+nzaJtecRVQmXrI7wWGjGMCEasxTBidSNKjGnEa6mGSe5UMGIthhnzVXxQ3AgzMvO4EY/Yi2HGXJ7bMTdCrUxnUaT2mRWGEY/oi2HGVJ5v5iGXpjNY6Ug2wojMOm7EzR7IHZ25mcrg6oJXOurm3o0wI7eOG3Gr65q9UjQ/9p9rVSMMyM3jRuBzXR/MPLTCjdg7ZUQhTvWB3DH14EYUdKs8jLVqxADCiMqw1ooRE+gwopCvtWzECI5GZGqtGTKCqxGRWitGLOBqRKDWQyNWcDYiYWveiCXcjQjMGjZiDQ8jHM7mVcJYmXvUCIezaZWo0eZxI9zRbFwl8mDzsBGG4yUi2TxqBD34fCYsv15q4vDLc5hHjVg9+QkmDA5/PTZyePXkDWfD8teGwf9ojn59V+XwnTnLk0Y/jbn69U2dxSeMMCITiUQikUgkEolEIpFIJBKJRCKRSOfyD6b+UK+OuxMpAAAAAElFTkSuQmCC", // Using data URL instead of file path for better portability
  });
};

export default generateInvoiceReceiptHtml;
