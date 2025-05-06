/// <reference types="react-scripts" />

export interface PrinterConfig {
  printInvoiceK80: string; // K80 thermal printer
  printInvoiceA4: string; // A4 regular printer
  printLabel: string; // Label printer
}

export interface PrintResponse {
  success: boolean;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
      printer: {
        print: (data: any) => void;
        getPrinterConfig: () => Promise<PrinterConfig>;
        updatePrinterConfig: (
          type: string,
          printerName: string
        ) => Promise<PrintResponse>;
        getAvailablePrinters: () => Promise<{
          success: boolean;
          printers: PrinterInfo[];
          error?: string;
        }>;
        onPrintResponse: (callback: (response: PrintResponse) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}
