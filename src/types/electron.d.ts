export {};

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

interface IpcRenderer {
  send: (channel: string, data: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface Printer {
  print: (data: { type: string; html: string }) => void;
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
}

declare global {
  namespace NodeJS {
    interface Global {}
  }

  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
      printer: Printer;
      checkPrinterConnection: () => Promise<boolean>;
      checkDrawerConnection: () => Promise<boolean>;
      checkNetworkConnection: () => Promise<boolean>;
    };
  }
}
