export interface PrinterConfig {
  printInvoiceK80: string; // K80 thermal printer
  printInvoiceA4: string; // A4 regular printer
  printLabel: string; // Label printer
}

export interface PrintResponse {
  success: boolean;
  error?: string;
  result?: any;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}
