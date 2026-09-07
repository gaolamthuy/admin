import { Banknote } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CashCountBoard } from './CashCountBoard';
import { TransferToday } from './TransferToday';

const STORAGE_KEY = 'glt-admin-cash-count';

export function CashCount() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="size-4 text-emerald-600" />
            Kiểm đếm tiền mặt
          </CardTitle>
          <CardDescription className="mt-1">
            Nhập số tờ từng mệnh giá — dữ liệu được giữ lại khi tải lại trang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashCountBoard storageKey={STORAGE_KEY} />
        </CardContent>
      </Card>

      <TransferToday />
    </div>
  );
}
