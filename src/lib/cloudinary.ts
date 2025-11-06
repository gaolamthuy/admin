import { env } from './env';

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export interface UploadImageParams {
  file: File;
  kiotvietId: number | string;
  folderOverride?: string;
}

/**
 * Upload ảnh lên Cloudinary (unsigned upload)
 * - Sử dụng upload preset unsigned (public ở client)
 * - public_id chuẩn hoá: `${kiotvietId}` (KHÔNG kèm timestamp)
 *   Lưu ý: để overwrite ảnh theo sản phẩm, bật overwrite trong upload preset
 *
 * @param params.file File ảnh cần upload (đã được validate MIME/size ở client)
 * @param params.kiotvietId ID sản phẩm từ kv_products.kiotviet_id
 * @param params.folderOverride Ghi đè folder nếu cần (mặc định lấy từ env)
 * @returns CloudinaryUploadResult chứa secure_url, public_id, metadata
 * @throws Error khi thiếu cấu hình hoặc khi upload thất bại
 */
export async function uploadImageToCloudinary(
  params: UploadImageParams
): Promise<CloudinaryUploadResult> {
  const { file, kiotvietId, folderOverride } = params;

  // Đọc cấu hình từ env (client-side, không có secret)
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const folder = folderOverride ?? env.VITE_CLOUDINARY_FOLDER;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Thiếu cấu hình Cloudinary: VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  // Xây dựng endpoint theo cloudName
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // Tạo public_id dạng {kiotvietId} (không timestamp) để cho phép overwrite theo phiên bản
  const basePublicId = `${kiotvietId}`;
  const publicId = folder
    ? `${folder.replace(/\/$/, '')}/${basePublicId}`
    : basePublicId;

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  form.append('public_id', publicId);
  if (folder && !publicId.startsWith(folder)) {
    form.append('folder', folder);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${response.status} ${text}`);
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
