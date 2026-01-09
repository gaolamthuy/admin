/**
 * Dialog component để upload ảnh sản phẩm
 *
 * @module pages/products/components/ProductImageUploadDialog
 */

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { useUploadProductImage } from '../hooks/useUploadProductImage';

/**
 * Props cho ProductImageUploadDialog
 */
export interface ProductImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kiotvietId: number;
  role: string; // 'main-original' | 'package-original'
  productName?: string;
}

/**
 * Dialog component để upload ảnh sản phẩm
 */
export const ProductImageUploadDialog = ({
  open,
  onOpenChange,
  kiotvietId,
  role,
  productName,
}: ProductImageUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadProductImage();

  /**
   * Xử lý khi chọn file
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setSelectedFile(file);

    // Tạo preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  /**
   * Xử lý khi click nút upload
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        kiotvietId,
        role,
      });

      // Reset form và đóng dialog
      handleClose();
    } catch (error) {
      // Error đã được handle trong hook
      console.error('Upload error:', error);
    }
  };

  /**
   * Cleanup preview URL khi component unmount hoặc file thay đổi
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /**
   * Xử lý khi đóng dialog
   */
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  /**
   * Xử lý khi click nút xóa file đã chọn
   */
  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload ảnh sản phẩm</DialogTitle>
          <DialogDescription>
            Upload ảnh cho role <strong>{role}</strong>
            {productName && (
              <>
                {' '}
                của sản phẩm <strong>{productName}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Chọn file ảnh</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                className="cursor-pointer"
              />
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full border rounded-md overflow-hidden bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

