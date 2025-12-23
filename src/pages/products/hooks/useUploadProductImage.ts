/**
 * Hook để upload ảnh sản phẩm lên Cloudinary và lưu metadata vào Supabase
 *
 * @module pages/products/hooks/useUploadProductImage
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';
import {
  uploadImageToCloudinary,
  validateImageFile,
  type CloudinaryUploadResult,
} from '@/lib/cloudinary';
import { toast } from 'sonner';

/**
 * Interface cho tham số upload
 */
export interface UploadProductImageParams {
  file: File;
  kiotvietId: number;
  role: string; // 'main-original' | 'package-original' | ...
  alt?: string;
  description?: string;
  useCloudflareFunction?: boolean; // Mặc định true để an toàn
}

/**
 * Interface cho kết quả upload
 */
export interface UploadProductImageResult {
  cloudinaryResult: CloudinaryUploadResult;
  supabaseRecord: {
    id: number;
    product_id: number;
    url: string;
    path: string;
    role: string;
    width: number;
    height: number;
    format: string;
    rev: number;
  };
}

/**
 * Hook để upload ảnh sản phẩm
 * - Validate file (MIME type, size)
 * - Upload lên Cloudinary với signed upload (overwrite được)
 * - Lưu metadata vào glt_product_images table
 * - Invalidate query cache để refresh UI
 *
 * @returns Mutation object với mutate function
 */
export const useUploadProductImage = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: UploadProductImageParams
    ): Promise<UploadProductImageResult> => {
      if (!session) {
        throw new Error('Chưa đăng nhập');
      }

      const { file, kiotvietId, role, alt, description, useCloudflareFunction = true } = params;

      // 1. Validate file
      try {
        validateImageFile(file, {
          maxBytes: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'File ảnh không hợp lệ'
        );
      }

      // 2. Upload lên Cloudinary
      let cloudinaryResult: CloudinaryUploadResult;
      try {
        cloudinaryResult = await uploadImageToCloudinary({
          file,
          kiotvietId,
          useSignedUpload: true,
          useCloudflareFunction, // Dùng Cloudflare Function để an toàn
        });
      } catch (error) {
        throw new Error(
          `Lỗi upload lên Cloudinary: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }

      // 3. Lưu metadata vào Supabase
      // Tìm record cũ với cùng product_id và role (nếu có) để tính rev mới
      const { data: existingRecord } = await supabase
        .from('glt_product_images')
        .select('id, rev')
        .eq('product_id', kiotvietId)
        .eq('role', role)
        .order('rev', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Tính rev mới (tăng 1 từ rev cũ, hoặc 1 nếu chưa có)
      const newRev = existingRecord?.rev ? existingRecord.rev + 1 : 1;

      // Insert record mới (giữ lịch sử các version)
      const { data: supabaseRecord, error: insertError } = await supabase
        .from('glt_product_images')
        .insert({
          product_id: kiotvietId,
          url: cloudinaryResult.secure_url,
          path: cloudinaryResult.public_id,
          role: role,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          rev: newRev,
          alt: alt || null,
          description: description || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(
          `Lỗi lưu metadata vào Supabase: ${insertError.message}`
        );
      }

      return {
        cloudinaryResult,
        supabaseRecord: supabaseRecord as UploadProductImageResult['supabaseRecord'],
      };
    },
    onSuccess: (data, variables) => {
      // Invalidate query cache để refresh UI
      queryClient.invalidateQueries({
        queryKey: ['product-images', variables.kiotvietId],
      });

      toast.success('Upload ảnh thành công!', {
        description: `Đã upload ${variables.role} cho sản phẩm #${variables.kiotvietId}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Lỗi upload ảnh', {
        description: error.message,
      });
    },
  });
};

