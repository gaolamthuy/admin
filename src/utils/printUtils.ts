import { PrinterConfig, PrintResponse, PrinterInfo } from "../types/electron";

/**
 * Checks if Electron is available in the current environment
 */
const isElectronAvailable = () => {
  return typeof window !== "undefined" && !!window.electron;
};

/**
 * Gets the current printer configuration
 * @returns A promise that resolves to the printer configuration
 */
export const getPrinterConfig = async (): Promise<PrinterConfig> => {
  try {
    if (!isElectronAvailable() || !window.electron?.printer) {
      return {
        printInvoiceK80: "", // K80 thermal printer
        printInvoiceA4: "", // A4 regular printer
        printLabel: "", // Label printer
      };
    }

    return await window.electron.printer.getPrinterConfig();
  } catch (error) {
    console.error("Error getting printer config:", error);
    return {
      printInvoiceK80: "", // K80 thermal printer
      printInvoiceA4: "", // A4 regular printer
      printLabel: "", // Label printer
    };
  }
};

/**
 * Updates the printer configuration
 * @param type - Type of print job (printInvoice, printInvoiceExtra, printLabel)
 * @param printerName - Name of the printer to use
 * @returns A promise that resolves to a success or error response
 */
export const updatePrinterConfig = async (
  type: keyof PrinterConfig,
  printerName: string
): Promise<PrintResponse> => {
  if (!isElectronAvailable() || !window.electron?.printer) {
    return {
      success: false,
      error: "Printer configuration is only available in the desktop app",
    };
  }
  return await window.electron.printer.updatePrinterConfig(type, printerName);
};

/**
 * Gets available printers on the system
 * @returns A promise that resolves to a list of available printers
 */
export const getAvailablePrinters = async (): Promise<PrinterInfo[]> => {
  try {
    if (!isElectronAvailable() || !window.electron?.printer) {
      return [];
    }

    const result = await window.electron.printer.getAvailablePrinters();
    if (result.success) {
      return result.printers;
    }

    console.error("Error getting available printers:", result.error);
    return [];
  } catch (error) {
    console.error("Error getting available printers:", error);
    return [];
  }
};

/**
 * Prints a document based on the specified type and HTML content
 * @param type - Type of print job (printInvoice, printInvoiceExtra, printLabel)
 * @param html - HTML content to print
 * @returns A promise that resolves to a success or error response
 */
export const printDocument = (
  type: string,
  html: string
): Promise<PrintResponse> => {
  return new Promise((resolve) => {
    try {
      if (!isElectronAvailable() || !window.electron?.printer) {
        return resolve({
          success: false,
          error: "Printing is only available in the desktop app",
        });
      }

      const responseHandler = (response: PrintResponse) => {
        window.electron?.printer?.removeAllListeners("print-response");
        resolve(response);
      };

      window.electron.printer.onPrintResponse(responseHandler);
      window.electron.printer.print({ type, html });
    } catch (error) {
      console.error("Error in printDocument:", error);
      resolve({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });
};

/**
 * Sends a print job to the local print agent
 */
export const sendPrintJobToAgent = async (
  docType: "invoice" | "label",
  docRef: Record<string, any>,
  printAgentId: string = ""
): Promise<PrintResponse> => {
  try {
    // Construct the print URL using the new print agent environment variables

    const printUrl = process.env.REACT_APP_BACKEND_URL + "/print/jobs";
    
    // Format the payload according to the expected format for each document type
    const formattedDocRef = { ...docRef };
    
    if (docType === "invoice") {
      // For invoice, we need a simple format with just the code
      formattedDocRef.code = docRef.kiotviet_invoice_code || docRef.code;
    } 
    else if (docType === "label") {
      // For label, extract the needed properties
      formattedDocRef.code = docRef.item_code || docRef.code;
      formattedDocRef.quantity = docRef.item_details?.quantity || docRef.quantity || 1;
      formattedDocRef.copies = docRef.item_details?.copies || docRef.copies || 1;
    }

    console.log(`Sending print job to agent at ${printUrl}`, {
      doc_type: docType,
      doc_ref: formattedDocRef,
      metadata: docRef.metadata || {}
    });

    const auth = btoa(`${process.env.REACT_APP_API_USERNAME}:${process.env.REACT_APP_API_PASSWORD}`)

    // Send the request to the print agent
    const response = await fetch(printUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        doc_type: docType,
        doc_ref: formattedDocRef,
        metadata: docRef.metadata || {}
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
