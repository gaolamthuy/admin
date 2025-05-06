declare module "qrcode" {
  /**
   * Generate a Data URL for a QR code from text.
   * @param text The content to encode into the QR code.
   * @param options Optional QR code generation options (e.g. width).
   * @returns A promise that resolves with a base64 Data URL string.
   */
  export function toDataURL(
    text: string,
    options?: { width?: number }
  ): Promise<string>;
}
