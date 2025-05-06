import axios from "axios";
import { supabase } from "./supabaseClient";
import { Customer } from "../types";

const KIOTVIET_BASE_URL =
  process.env.REACT_APP_KIOTVIET_BASE_URL || "https://public.kiotapi.com";
const RETAILER = "gaolamthuy";

interface ProductItem {
  productId: number;
  quantity: number;
  price: number;
}

interface Payment {
  Method: string;
  MethodStr: string;
  Amount: number;
  Id: number;
  AccountId: null;
  VoucherId: null;
  VoucherCampaignId: null;
}

interface CreateInvoiceParams {
  branchId: number;
  customerId: number | null;
  soldById: number;
  invoiceDetails: ProductItem[];
  payments: Payment[];
  totalAmount: number;
}

export const kiotVietService = {
  async getToken(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("system")
        .select("title, value")
        .eq("title", "kiotviet")
        .single();

      if (error) {
        throw error;
      }

      return data.value;
    } catch (error) {
      console.error("Error getting token:", error);
      throw error;
    }
  },

  async createInvoice({
    branchId,
    customerId,
    soldById,
    invoiceDetails,
    payments,
    totalAmount,
  }: CreateInvoiceParams): Promise<any> {
    try {
      const token = await this.getToken();

      const invoiceData = {
        branchId,
        isApplyVoucher: false,
        purchaseDate: new Date().toISOString(),
        customerId,
        discount: 0,
        note: "",
        method: "Cash",
        accountId: null,
        usingCod: false,
        soldById,
        orderId: null,
        invoiceDetails,
        deliveryDetail: null,
        Payments: payments,
        customer: customerId ? { id: customerId } : null,
      };

      console.log("Sending to KiotViet:", JSON.stringify(invoiceData, null, 2));

      const response = await axios.post(
        `${KIOTVIET_BASE_URL}/invoices`,
        invoiceData,
        {
          headers: {
            Retailer: RETAILER,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await this.saveInvoiceToSupabase(response.data, customerId);

      return response.data;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  },

  async saveInvoiceToSupabase(
    invoiceData: any,
    customerId: number | null
  ): Promise<void> {
    try {
      // 1. Save the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("kv_invoices")
        .insert({
          kiotviet_id: invoiceData.id,
          uuid: invoiceData.uuid,
          code: invoiceData.code,
          purchase_date: invoiceData.purchaseDate,
          branch_id: invoiceData.branchId,
          branch_name: invoiceData.branchName,
          sold_by_id: invoiceData.soldById,
          sold_by_name: invoiceData.soldByName,
          kiotviet_customer_id: customerId,
          customer_code: invoiceData.customerCode || "KHACHLE",
          customer_name: invoiceData.customerName || "Khách lẻ",
          order_code: invoiceData.orderCode,
          total: invoiceData.total,
          total_payment: invoiceData.totalPayment,
          status: invoiceData.status,
          status_value: invoiceData.statusValue,
          using_cod: invoiceData.usingCod,
          created_date: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // 2. Save invoice details
      if (invoiceData.invoiceDetails && invoiceData.invoiceDetails.length > 0) {
        const invoiceDetailsToInsert = invoiceData.invoiceDetails.map(
          (detail: any) => ({
            invoice_id: invoice.id,
            kiotviet_product_id: detail.productId,
            product_code: detail.productCode,
            product_name: detail.productName,
            category_id: detail.categoryId,
            category_name: detail.categoryName,
            quantity: detail.quantity,
            price: detail.price,
            discount: detail.discount || 0,
            sub_total: detail.subTotal,
            note: detail.note || "",
            serial_numbers: detail.serialNumbers || "",
            return_quantity: detail.returnQuantity || 0,
          })
        );

        const { error: detailsError } = await supabase
          .from("kv_invoice_details")
          .insert(invoiceDetailsToInsert);

        if (detailsError) {
          throw detailsError;
        }
      }

      // 3. Save invoice payments - This section is commented out since kv_invoice_payments table is dropped
      /*
      if (invoiceData.payments && invoiceData.payments.length > 0) {
        const paymentsToInsert = invoiceData.payments.map((payment: any) => ({
          invoice_id: invoice.id,
          kiotviet_payment_id: payment.id,
          code: payment.code,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          status_value: payment.statusValue,
          trans_date: payment.transDate
        }));

        const { error: paymentsError } = await supabase
          .from('kv_invoice_payments')
          .insert(paymentsToInsert);

        if (paymentsError) {
          throw paymentsError;
        }
      }
      */

      // Payment info is now stored in a log format instead
      if (invoiceData.payments && invoiceData.payments.length > 0) {
        console.log(
          "Payment data received but not saved to database (table was dropped):",
          JSON.stringify(invoiceData.payments, null, 2)
        );
      }
    } catch (error) {
      console.error("Error saving invoice to Supabase:", error);
      throw error;
    }
  },
};
