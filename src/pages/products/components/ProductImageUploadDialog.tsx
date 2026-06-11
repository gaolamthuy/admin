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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, CheckCircle } from 'lucide-react';
import {
  useUploadProductImage,
  type UploadProductPhotoResult,
  type ImageRole,
} from '../hooks/useProductShow';

const IMAGE_ROLES = [
  { value: 'closeup', label: 'Closeup (cận cảnh)' },
  { value: 'package', label: 'Package (đóng gói)' },
] as const satisfies { value: ImageRole; label: string }[];

export interface ProductImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kiotvietId: number;
  productName?: string;
  defaultRole?: string;
}

export const ProductImageUploadDialog = ({
  open,
  onOpenChange,
  kiotvietId,
  productName,
  defaultRole,
}: ProductImageUploadDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<ImageRole>(
    (defaultRole as ImageRole) || IMAGE_ROLES[0].value
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadResult, setUploadResult] =
    useState<UploadProductPhotoResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadProductImage();

  useEffect(() => {
    if (open) {
      setSelectedRole((defaultRole as ImageRole) || IMAGE_ROLES[0].value);
      setUploadResult(null);
    }
  }, [open, defaultRole]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadResult(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        kiotvietId,
        role: selectedRole,
      });
      setUploadResult(result);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload ảnh sản phẩm
          </DialogTitle>
          <DialogDescription>
            {productName && (
              <>
                Sản phẩm: <strong>{productName}</strong> (KV#{kiotvietId})
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as ImageRole)}
              disabled={uploadMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn role" />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

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

          {uploadResult && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Upload thành công — {uploadResult.product_name} (#{uploadResult.kiotviet_id})
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <a
                    href={uploadResult.original?.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    View
                  </a>
                </div>
                {uploadResult.overlay?.public_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overlay:</span>
                    <a
                      href={uploadResult.overlay.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      View ({uploadResult.overlay.size_kb} KB)
                    </a>
                  </div>
                )}
                {uploadResult.display?.public_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Display:</span>
                    <a
                      href={uploadResult.display.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      View ({uploadResult.display.size_kb} KB)
                    </a>
                  </div>
                )}
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
            {uploadResult ? 'Đóng' : 'Hủy'}
          </Button>
          {!uploadResult && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
