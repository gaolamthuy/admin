/**
 * Print Service - Handles printing functionality for the POS app
 */
import { PrinterConfig, PrintResponse, PrinterInfo } from "../types/electron";

/**
 * Checks if Electron is available in the current environment
 */
const isElectronAvailable = () => {
  return typeof window !== "undefined" && !!window.electron;
};

/**
 * Prints a document based on the specified type and HTML content
 * @param type - Type of print job (printInvoice, printInvoiceExtra, printLabel)
 * @param html - HTML content to print
 * @returns A promise that resolves to a success or error response
 */
export function printDocument(
  type: "printInvoice" | "printInvoiceExtra" | "printLabel",
  html: string
): Promise<PrintResponse> {
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
}

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
export async function getAvailablePrinters(): Promise<PrinterInfo[]> {
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
}
