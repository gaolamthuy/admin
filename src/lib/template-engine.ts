import Handlebars from "handlebars";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PrintTemplate } from "@/hooks/usePrintTemplates";

/**
 * Template Engine class để xử lý việc compile và render print templates
 */
export class TemplateEngine {
  private static supabase = createClientComponentClient();

  // Register Handlebars helper for currency formatting
  static {
    Handlebars.registerHelper(
      "formatCurrency",
      (value: number | string | undefined) => {
        if (value === undefined || value === null) {
          return "";
        }
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(num)) {
          return value; // Return original if not a valid number
        }
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          minimumFractionDigits: 0, // No decimal places for whole numbers
          maximumFractionDigits: 0,
        }).format(num);
      }
    );

    // Register Handlebars helper for number formatting with thousand separators
    Handlebars.registerHelper(
      "formatNumber",
      (value: number | string | undefined) => {
        if (value === undefined || value === null) {
          return "";
        }
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(num)) {
          return value; // Return original if not a valid number
        }
        return new Intl.NumberFormat("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      }
    );
  }

  /**
   * Compile template với data sử dụng Handlebars
   * @param templateContent - Nội dung template HTML
   * @param data - Data object để inject vào template
   * @returns HTML string đã được compile
   */
  static compileTemplate(templateContent: string, data: any): string {
    try {
      const template = Handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      console.error("Error compiling template:", error);
      throw new Error("Failed to compile template");
    }
  }

  /**
   * Lấy template từ database theo template type
   * @param templateType - Loại template (purchase_order, invoice, etc.)
   * @param templateId - ID cụ thể của template (optional)
   * @returns Template content string
   */
  static async getTemplate(
    templateType: string,
    templateId?: number
  ): Promise<string> {
    try {
      let query = this.supabase
        .from("glt_print_templates")
        .select("content")
        .eq("template_type", templateType)
        .eq("is_active", true);

      if (templateId) {
        query = query.eq("id", templateId);
      } else {
        // Lấy template mặc định hoặc template đầu tiên
        query = query.order("is_default", { ascending: false });
      }

      const { data, error } = await query.limit(1).single();

      if (error) {
        throw error;
      }

      if (!data?.content) {
        throw new Error("Template not found");
      }

      return data.content;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw new Error("Failed to fetch template from database");
    }
  }

  /**
   * Lấy tất cả templates của một loại
   * @param templateType - Loại template
   * @returns Array of templates
   */
  static async getAllTemplates(templateType: string): Promise<PrintTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from("glt_print_templates")
        .select("*")
        .eq("template_type", templateType)
        .eq("is_active", true)
        .order("is_default", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw new Error("Failed to fetch templates");
    }
  }

  /**
   * Render template với data và tạo print window
   * @param templateType - Loại template
   * @param data - Data để inject vào template
   * @param templateId - ID template cụ thể (optional)
   */
  static async printTemplate(
    templateType: string,
    data: any,
    templateId?: number
  ): Promise<void> {
    try {
      // Lấy template content và metadata
      const templateData = await this.getTemplateWithMetadata(
        templateType,
        templateId
      );
      const templateContent = templateData.content;
      const pageSize = templateData.page_size || "A4";
      const pageWidth = templateData.page_width;
      const pageHeight = templateData.page_height;
      const customCss = templateData.custom_css || "";

      // Compile template với data
      const htmlContent = this.compileTemplate(templateContent, data);

      // Tạo print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error(
          "Cannot open print window. Please check popup blocker."
        );
      }

      // Generate CSS based on page size
      const pageCSS = this.generatePageCSS(pageSize, pageWidth, pageHeight);

      // Write HTML content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print - ${templateType}</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
            <style>
              ${pageCSS}
              ${customCss}
            </style>
            <script>
              // Auto close window after print dialog is closed
              window.addEventListener('afterprint', function() {
                window.close();
              });
              
              // Also close if user cancels print
              window.addEventListener('beforeunload', function() {
                // This will trigger when user navigates away or closes tab
              });
            </script>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (error) {
      console.error("Error printing template:", error);
      alert(
        "Lỗi khi in: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Lấy template với metadata (page size, dimensions)
   */
  private static async getTemplateWithMetadata(
    templateType: string,
    templateId?: number
  ): Promise<{
    content: string;
    page_size?: string;
    page_width?: number;
    page_height?: number;
    custom_css?: string;
  }> {
    try {
      let query = this.supabase
        .from("glt_print_templates")
        .select("content, page_size, page_width, page_height, custom_css")
        .eq("template_type", templateType)
        .eq("is_active", true);

      if (templateId) {
        query = query.eq("id", templateId);
      } else {
        query = query.order("is_default", { ascending: false });
      }

      const { data, error } = await query.limit(1).single();

      if (error) {
        throw error;
      }

      if (!data?.content) {
        throw new Error("Template not found");
      }

      return data;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw new Error("Failed to fetch template from database");
    }
  }

  /**
   * Generate CSS based on page size
   */
  private static generatePageCSS(
    pageSize: string,
    pageWidth?: number,
    pageHeight?: number
  ): string {
    const pageSizes = {
      A7: { width: "75mm", height: "50mm" },
      A6: { width: "100mm", height: "75mm" },
      A5: { width: "148mm", height: "105mm" },
      A4: { width: "210mm", height: "297mm" },
    };

    const size = pageSizes[pageSize as keyof typeof pageSizes] || pageSizes.A4;
    const width = pageWidth ? `${pageWidth}mm` : size.width;
    const height = pageHeight ? `${pageHeight}mm` : size.height;

    return `
      body { 
        font-family: 'Nunito', Arial, sans-serif; 
        margin: 0; 
        padding: 5mm;
        line-height: 1.3;
        font-size: 14px;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-template {
        width: 100%;
        max-width: ${width};
        margin: 0 auto;
        display: block;
      }
      
      .products { margin: 0; padding: 0; }

      .product-info {
        page-break-after: always;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-column-break-inside: avoid;
        -webkit-region-break-inside: avoid;
        display: block;
        margin: 0;
        box-sizing: border-box;
        padding: 3mm 6mm;
        overflow: hidden;
      }
      
      .product-info:last-child {
        page-break-after: auto;
        min-height: auto;
      }
      
      .info-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: start;
        padding: 3px 0;
        gap: 8px;
        font-size: 18px;
      }
      
      .label { font-weight: bold; color: #000; }
      
      .value { color: #000; text-align: right; }
      
      @media print {
        body { margin: 0; padding: 0; color: #000 !important; }
        .print-template { 
          max-width: none;
          width: 100%;
        }
        .product-info {
          page-break-after: always;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          -webkit-column-break-inside: avoid;
          -webkit-region-break-inside: avoid;
          overflow: hidden;
        }
        .product-info:last-child {
          page-break-after: auto;
          min-height: auto;
        }
        @page {
          size: ${width} ${height};
          margin: 0;
        }
      }
      
      @media screen {
        body {
          background: #f5f5f5;
          padding: 20px;
        }
        .print-template {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #ddd;
        }
        .product-info {
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
      }
    `;
  }
}
