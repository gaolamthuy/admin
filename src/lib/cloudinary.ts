import { env } from './env';

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  version?: number;
}

export interface UploadImageParams {
  file: File;
  kiotvietId: number | string;
  folderOverride?: string;
  useSignedUpload?: boolean; // Mặc định true để overwrite được
  useCloudflareFunction?: boolean; // Mặc định false, set true để dùng Cloudflare Function (an toàn hơn)
}

/**
 * Interface cho các tham số cần ký trong signed upload
 */
interface SignatureParams {
  invalidate?: boolean;
  overwrite?: boolean;
  public_id?: string;
  timestamp: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Tạo SHA-1 hash từ string (dùng Web Crypto API)
 * @param message String cần hash
 * @returns Promise<string> Hex string của SHA-1 hash
 */
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Tạo Cloudinary signature cho signed upload
 * Công thức: SHA1(string_to_sign + api_secret)
 * string_to_sign = các tham số sắp xếp a-z, nối bằng & (trừ file, api_key, signature)
 *
 * @param params Object chứa các tham số upload cần ký
 * @param apiSecret API secret từ Cloudinary
 * @returns Promise<string> Signature hex string
 */
async function generateCloudinarySignature(
  params: SignatureParams,
  apiSecret: string
): Promise<string> {
  // Sắp xếp keys theo alphabet và build string_to_sign
  const sortedKeys = Object.keys(params)
    .filter(key => key !== 'file' && key !== 'api_key' && key !== 'signature')
    .sort();

  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

  // SHA1(string_to_sign + api_secret)
  const signature = await sha1(stringToSign + apiSecret);
  return signature;
}

/**
 * Upload ảnh lên Cloudinary với signed upload để hỗ trợ overwrite
 * - Sử dụng signed upload (cần API_KEY và API_SECRET) để có thể overwrite
 * - public_id chuẩn hoá: `${kiotvietId}` (KHÔNG kèm timestamp) để overwrite được
 * - Tự động set overwrite=true và invalidate=true để xóa cache CDN
 *
 * ⚠️ LƯU Ý BẢO MẬT:
 * - API_SECRET không nên expose ở client-side trong production
 * - Nên migrate sang Supabase Edge Function hoặc backend API để generate signature
 * - Hiện tại chỉ dùng cho development/testing
 *
 * @param params.file File ảnh cần upload (đã được validate MIME/size ở client)
 * @param params.kiotvietId ID sản phẩm từ kv_products.kiotviet_id
 * @param params.folderOverride Ghi đè folder nếu cần (mặc định lấy từ env)
 * @param params.useSignedUpload Sử dụng signed upload (mặc định true để overwrite được)
 * @returns CloudinaryUploadResult chứa secure_url, public_id, metadata, version
 * @throws Error khi thiếu cấu hình hoặc khi upload thất bại
 */
export async function uploadImageToCloudinary(
  params: UploadImageParams
): Promise<CloudinaryUploadResult> {
  const { file, kiotvietId, folderOverride, useSignedUpload = true } = params;

  // Đọc cấu hình từ env
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
  const folder = folderOverride ?? env.VITE_CLOUDINARY_FOLDER;

  if (!cloudName) {
    throw new Error('Thiếu cấu hình Cloudinary: VITE_CLOUDINARY_CLOUD_NAME');
  }

  // Xây dựng endpoint theo cloudName
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // Tạo public_id dạng {kiotvietId} (không timestamp) để cho phép overwrite
  const basePublicId = `${kiotvietId}`;
  const publicId = folder
    ? `${folder.replace(/\/$/, '')}/${basePublicId}`
    : basePublicId;

  const form = new FormData();
  form.append('file', file);

  // Signed upload để overwrite được
  if (useSignedUpload) {
    // Tạo timestamp (Unix seconds)
    const timestamp = Math.floor(Date.now() / 1000).toString();

    let apiKey: string;
    let signature: string;

    // Option 1: Dùng Cloudflare Function (AN TOÀN - khuyến nghị cho production)
    if (params.useCloudflareFunction) {
      try {
        // Gọi Cloudflare Pages Function để generate signature
        const functionUrl = '/api/cloudinary-signature'; // Relative URL, Cloudflare tự resolve
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: publicId,
            timestamp,
            overwrite: true,
            invalidate: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Cloudflare Function error: ${response.status} ${errorData.error || response.statusText}`
          );
        }

        const { signature: sig, api_key: key } = await response.json();
        signature = sig;
        apiKey = key;
      } catch (error) {
        throw new Error(
          `Failed to get signature from Cloudflare Function: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    } else {
      // Option 2: Client-side signature (DEV ONLY - không an toàn)
      const clientApiKey = env.VITE_CLOUDINARY_API_KEY;
      const clientApiSecret = env.VITE_CLOUDINARY_API_SECRET;

      if (!clientApiKey || !clientApiSecret) {
        throw new Error(
          'Thiếu cấu hình Cloudinary signed upload: VITE_CLOUDINARY_API_KEY hoặc VITE_CLOUDINARY_API_SECRET. ' +
            'Để overwrite ảnh, cần signed upload với API key/secret. ' +
            'Hoặc set useCloudflareFunction=true để dùng Cloudflare Function (an toàn hơn).'
        );
      }

      // Các tham số cần ký (sắp xếp a-z, exclude file/api_key/signature)
      const signatureParams: SignatureParams = {
        invalidate: true, // Xóa cache CDN cũ
        overwrite: true, // Cho phép overwrite
        public_id: publicId,
        timestamp,
      };

      // Generate signature ở client (KHÔNG AN TOÀN)
      signature = await generateCloudinarySignature(
        signatureParams,
        clientApiSecret
      );
      apiKey = clientApiKey;
    }

    // Thêm các tham số vào form
    form.append('public_id', publicId);
    form.append('overwrite', 'true');
    form.append('invalidate', 'true');
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
  } else {
    // Fallback: unsigned upload với preset (không overwrite được)
    const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) {
      throw new Error(
        'Thiếu cấu hình Cloudinary: VITE_CLOUDINARY_UPLOAD_PRESET (cho unsigned upload)'
      );
    }
    form.append('upload_preset', uploadPreset);
    form.append('public_id', publicId);
    if (folder && !publicId.startsWith(folder)) {
      form.append('folder', folder);
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const errorData = text ? JSON.parse(text) : {};
    throw new Error(
      `Cloudinary upload failed: ${response.status} ${errorData.error?.message || text}`
    );
  }

  const json = (await response.json()) as CloudinaryUploadResult;
  return json;
}

/**
 * Validate sơ bộ file ảnh trước khi upload (client-side)
 * @param file File cần kiểm tra
 * @param options.maxBytes Giới hạn kích thước tối đa (mặc định 10MB)
 * @param options.allowedTypes Danh sách MIME types cho phép
 * @returns true nếu hợp lệ, ngược lại ném lỗi
 */
export function validateImageFile(
  file: File,
  options?: { maxBytes?: number; allowedTypes?: string[] }
): true {
  const maxBytes = options?.maxBytes ?? 10 * 1024 * 1024; // 10MB
  const allowed = options?.allowedTypes ?? [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowed.includes(file.type)) {
    throw new Error('Định dạng ảnh không được hỗ trợ');
  }

  if (file.size > maxBytes) {
    throw new Error('Kích thước ảnh vượt quá giới hạn cho phép');
  }

  return true;
}
