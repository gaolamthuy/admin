import { PrinterConfig, PrintResponse, PrinterInfo } from "../types/electron";

// Web-compatible printer utilities

export const getAvailablePrinters = async (): Promise<PrinterInfo[]> => {
  // In web environment, we cannot retrieve system printers
  // Return empty array to indicate no system printers are available
  console.log("System printers cannot be accessed in web environment");
  return [];
};

export const getPrinterConfig = async (): Promise<PrinterConfig> => {
  // Try to get from localStorage if previously saved
  try {
    const savedConfig = localStorage.getItem("printerConfig");
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (e) {
    console.error("Error reading printer config from localStorage:", e);
  }

  // Return default empty config
  return {
    printInvoiceK80: "", // K80 thermal printer
    printInvoiceA4: "", // A4 regular printer
    printLabel: "", // Label printer
  };
};

export const updatePrinterConfig = async (
  type: keyof PrinterConfig,
  printerName: string
): Promise<PrintResponse> => {
  try {
    // Get current config
    const currentConfig = await getPrinterConfig();

    // Update the specified printer
    const newConfig = {
      ...currentConfig,
      [type]: printerName,
    };

    // Save to localStorage
    localStorage.setItem("printerConfig", JSON.stringify(newConfig));

    return { success: true };
  } catch (error) {
    console.error("Error updating printer config:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Prints document using the browser's print dialog
 * @param type - The printer type (printInvoice, printInvoiceExtra, printLabel)
 * @param html - The HTML content to print
 * @returns A promise that resolves to a success or error response
 */
export const printDocument = async (
  type: keyof PrinterConfig,
  html: string
): Promise<PrintResponse> => {
  try {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return {
        success: false,
        error: "Popup blocked. Please allow popups for this website.",
      };
    }

    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            // Automatically print when content is loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    return { success: true };
  } catch (error) {
    console.error("Error printing document:", error);
    return { success: false, error: String(error) };
  }
};

// Helper function to create a proper environment variable file
export const createEnvFile = () => {
  console.log("Creating .env file in the root directory");
  const envContent = `
REACT_APP_BACKEND_URL=https://api.gaolamthuy.vn
REACT_APP_API_USERNAME=username123
REACT_APP_API_PASSWORD=password123456
  `.trim();

  console.log("Suggested .env content:", envContent);
  return {
    success: true,
    message: "Create a .env file in the root directory with the above content",
    envContent,
  };
};

// Helper function to validate and prepare print job payload
export const preparePrintJobPayload = (
  docType: string,
  data: any
): { payload: any; error?: string } => {
  // Using a more flexible type for the payload
  const payload: Record<string, any> = { doc_type: docType };

  switch (docType) {
    case "invoice-k80":
    case "invoice-a5":
      // For invoice document types, we need exactly one of these fields
      if (!data.kiotviet_invoice_id && !data.kiotviet_invoice_code) {
        return {
          payload: null,
          error:
            "Missing required invoice identifier. Either kiotviet_invoice_id or kiotviet_invoice_code must be provided.",
        };
      }

      // Only include one identifier to comply with API requirements
      if (data.kiotviet_invoice_code) {
        payload["kiotviet_invoice_code"] = data.kiotviet_invoice_code;
      } else if (data.kiotviet_invoice_id) {
        payload["kiotviet_invoice_id"] = data.kiotviet_invoice_id;
      }
      break;

    case "label":
      // For label printing
      // Add any specific requirements for label printing here
      if (!data.item_id && !data.item_code && !data.item_details) {
        return {
          payload: null,
          error: "Missing required item information for label printing",
        };
      }

      // Add all provided item data
      if (data.item_id) payload["item_id"] = data.item_id;
      if (data.item_code) payload["item_code"] = data.item_code;
      if (data.item_details) payload["item_details"] = data.item_details;
      break;

    case "test-connection":
      // For test connections, include all data
      Object.assign(payload, data);
      break;

    default:
      console.warn(`Unknown document type: ${docType}`);
      // For unknown types, just pass all data through
      Object.assign(payload, data);
  }

  return { payload };
};

// New function to send print jobs to the server
export const sendPrintJobToServer = async (
  docType: string,
  data: any
): Promise<PrintResponse> => {
  try {
    // Improved environment variable handling
    // Try to access from both process.env and window._env_ (if you're using runtime env variables)
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    console.log("Backend URL used:", backendUrl); // Enhanced debugging log

    const printApiUrl = `${backendUrl}/print/jobs`;
    console.log("Print API URL:", printApiUrl);

    // Validate and prepare the payload
    const { payload, error } = preparePrintJobPayload(docType, data);

    // Return early if there was a validation error
    if (error) {
      console.error("Payload validation error:", error);
      return {
        success: false,
        error,
      };
    }

    // Get the auth credentials from env or use defaults
    const username =
      process.env.REACT_APP_API_USERNAME ||
      (window as any)._env_?.REACT_APP_API_USERNAME ||
      "username123";

    const password =
      process.env.REACT_APP_API_PASSWORD ||
      (window as any)._env_?.REACT_APP_API_PASSWORD ||
      "password123456";

    // Create the Authorization header with Basic auth
    const authHeader = "Basic " + btoa(`${username}:${password}`);

    console.log("Sending print job to server:", {
      url: printApiUrl,
      docType,
      payloadPreview: { ...payload, _preview: true },
    });

    // Send the request
    const response = await fetch(printApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Print server error (${response.status}): ${errorText}`);
      return {
        success: false,
        error: `Server responded with ${response.status}: ${
          errorText || "Unknown error"
        }`,
      };
    }

    const result = await response.json();
    console.log("Print job sent successfully:", result);

    return { success: true, result };
  } catch (error) {
    console.error("Error sending print job to server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
