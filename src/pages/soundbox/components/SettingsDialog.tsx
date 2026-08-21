import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Play,
} from 'lucide-react';
import { useTheme } from '@/components/app-layout/theme/theme-provider';
import { isMuted, setMutedState } from './MuteToggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTestVoice: () => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  onTestVoice,
}: SettingsDialogProps) {
  const [muted, setMuted] = useState(isMuted());
  const { theme, setTheme } = useTheme();

  useEffect(() => setMuted(isMuted()), [isOpen]);

  const handleMuteToggle = (checked: boolean) => {
    setMuted(checked);
    setMutedState(checked);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Cài đặt
          </DialogTitle>
          <DialogDescription>Chỉnh sửa âm thanh và giao diện</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Âm thanh</CardTitle>
              <CardDescription>Tắt/bật thông báo giọng đọc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    Thông báo giọng đọc
                  </span>
                </div>
                <Switch checked={!muted} onCheckedChange={handleMuteToggle} />
              </div>

              <Separator />

              <Button
                onClick={onTestVoice}
                variant="outline"
                className="w-full"
                disabled={muted}
              >
                <Play className="h-4 w-4 mr-2" />
                Test âm thanh thông báo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Giao diện</CardTitle>
              <CardDescription>
                Chuyển đổi giữa chế độ sáng và tối
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Chế độ tối</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
