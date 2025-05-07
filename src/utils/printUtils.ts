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

/**
 * Sends a print job to the local print agent
 */
export const sendPrintJobToAgent = async (
  docType: "invoice" | "label",
  docRef: Record<string, any>
): Promise<PrintResponse> => {
  try {
    // Get the print agent URL and port from environment variables
    const agentUrl = process.env.REACT_APP_PRINT_AGENT_URL || "localhost";
    const agentPort = process.env.REACT_APP_PRINT_AGENT_PORT || "3002";
    
    if (!agentUrl || !agentPort) {
      console.error("Print agent URL or port not configured in environment variables");
      return {
        success: false,
        error: "Print agent not configured. Please check your environment setup."
      };
    }

    const printUrl = `http://${agentUrl}:${agentPort}/print`;
    
    // Format the payload according to the expected format for each document type
    const formattedDocRef = { ...docRef };
    
    if (docType === "invoice") {
      // For invoice, we need a simple format with just the code
      formattedDocRef.code = docRef.kiotviet_invoice_code || docRef.code;
      
      // Remove unnecessary fields that the print agent doesn't expect
      delete formattedDocRef.kiotviet_invoice_code;
      delete formattedDocRef.invoice_id;
      delete formattedDocRef.customer_id;
      delete formattedDocRef.metadata;
    } 
    else if (docType === "label") {
      // For label, extract the needed properties
      formattedDocRef.code = docRef.item_code || docRef.code;
      formattedDocRef.quantity = docRef.item_details?.quantity || docRef.quantity || 1;
      formattedDocRef.copies = docRef.item_details?.copies || docRef.copies || 1;
      
      // Remove unnecessary fields
      delete formattedDocRef.item_id;
      delete formattedDocRef.item_code;
      delete formattedDocRef.item_details;
      delete formattedDocRef.kiotviet_invoice_code;
      delete formattedDocRef.invoice_id;
    }

    console.log(`Sending print job to agent at ${printUrl}`, {
      doc_type: docType,
      doc_ref: formattedDocRef
    });

    // Send the request to the print agent
    const response = await fetch(printUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        doc_type: docType,
        doc_ref: formattedDocRef
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Print agent error (${response.status}): ${errorText}`);
      return {
        success: false,
        error: `Print agent responded with ${response.status}: ${errorText || "Unknown error"}`
      };
    }

    const result = await response.json();
    console.log("Print job sent successfully:", result);

    return { success: true, result };
  } catch (error) {
    console.error("Error sending print job to agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// For backward compatibility
export const sendPrintJobToServer = sendPrintJobToAgent;
