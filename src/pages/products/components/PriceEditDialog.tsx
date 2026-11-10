/**
 * Price Edit Dialog
 * Một input duy nhất: Giá nhập PO. Cost tự derive = raw + extra PO/đơn vị +
 * extra SP, giá bán tự tính theo markup + làm tròn. Cập nhật lên KV gồm cả
 * cost + giá bán (master + đơn vị con).
 *
 * Flow cập nhật: bấm "Cập nhật giá" → đợi Windmill/KV phản hồi 200 →
 * màn hình thành công → admin bấm "In bảng giá" (user gesture → không bị
 * popup blocker chặn), in với số liệu đã xác nhận từ KV.
 *
 * @module pages/products/components/PriceEditDialog
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Info,
  Loader2,
  Printer,
} from 'lucide-react';
import { getPrintUrl } from '@/lib/windmill';
import { submitPostForm } from '@/lib/print';
import type { UpdateProductPriceResult } from '../hooks/useUpdateProductPrice';
import type { CalculateFromPo } from '@/types';

export interface PriceEditChildUnit {
  kiotviet_id: number;
  code: string;
  full_name: string;
  unit: string;
  conversion_value: number;
  base_price: number;
}

interface PriceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrice: (
    kiotvietId: number,
    params: { targetCost?: number; targetPoPrice?: number }
  ) => Promise<UpdateProductPriceResult>;
  productName: string;
  productCode?: string;
  kiotvietId: number;
  basePrice: number;
  currentCost: number | null;
  markup: number;
  roundStep: number;
  extraCost: number;
  childUnits: PriceEditChildUnit[];
  calculateFromPo?: CalculateFromPo | null;
  orderTemplate?: string | null;
}

const CHILD_MARKUP_PER_CV = 2000;

const fmt = (n: number | null | undefined) =>
  n != null ? Math.round(n).toLocaleString('vi-VN') : '-';

const formatError = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    return JSON.stringify(obj);
  }
  return String(e);
};

export const PriceEditDialog: React.FC<PriceEditDialogProps> = ({
  isOpen,
  onClose,
  onUpdatePrice,
  productName,
  productCode,
  kiotvietId,
  basePrice,
  currentCost,
  markup,
  roundStep,
  extraCost,
  childUnits,
  calculateFromPo,
  orderTemplate,
}) => {
  const [poRawStr, setPoRawStr] = React.useState('');
  const [phase, setPhase] = React.useState<
    'input' | 'updating' | 'success' | 'error'
  >('input');
  const [result, setResult] = React.useState<UpdateProductPriceResult | null>(
    null
  );
  const [errorMsg, setErrorMsg] = React.useState('');

  const hasPo = calculateFromPo != null;
  const extraPerUnit = calculateFromPo?.latest_extra_cost_per_unit ?? 0;

  const defaultPoRawStr =
    calculateFromPo?.latest_raw_price != null
      ? String(Math.round(calculateFromPo.latest_raw_price))
      : '';

  // Prefill khi mở dialog
  React.useEffect(() => {
    if (isOpen) {
      setPoRawStr(defaultPoRawStr);
      setPhase('input');
      setResult(null);
      setErrorMsg('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const targetPo = parseInt(poRawStr, 10) || 0;
  const hasChange = poRawStr !== defaultPoRawStr && targetPo > 0;
  const canSubmit = hasChange;

  // Cost tự derive từ giá nhập PO
  const derivedCost = targetPo > 0 ? targetPo + extraPerUnit + extraCost : null;

  const newBasePrice =
    derivedCost != null
      ? Math.ceil((derivedCost + markup) / roundStep) * roundStep
      : null;

  const computedChildren =
    derivedCost != null
      ? childUnits.map(cu => ({
          ...cu,
          new_price:
            cu.conversion_value > 0
              ? (derivedCost + CHILD_MARKUP_PER_CV) * cu.conversion_value
              : null,
        }))
      : [];

  const handleUpdate = async () => {
    if (!canSubmit || derivedCost == null) return;
    setPhase('updating');
    setErrorMsg('');
    try {
      const r = await onUpdatePrice(kiotvietId, { targetCost: derivedCost });
      setResult(r);
      setPhase('success');
    } catch (e) {
      setErrorMsg(formatError(e));
      setPhase('error');
    }
  };

  // In bảng giá với số liệu ĐÃ XÁC NHẬN từ response KV
  const handlePrint = () => {
    if (!result) return;
    const childUnitInfo = (result.children ?? []).map(c => {
      const cu = childUnits.find(u => u.kiotviet_id === c.kiotviet_id);
      const price = Number(c.new_baseprice);
      return {
        kiotviet_id: c.kiotviet_id,
        code: cu?.code ?? '',
        full_name: c.name,
        unit: cu?.unit ?? '',
        base_price: price,
        conversion_value: cu?.conversion_value ?? 0,
        price_per_master_unit:
          cu && cu.conversion_value > 0
            ? Math.round(price / cu.conversion_value)
            : null,
      };
    });
    submitPostForm(getPrintUrl(), {
      printType: 'priceboard',
      kiotviet_id: String(kiotvietId),
      base_price: String(result.master.new_baseprice),
      ...(orderTemplate && { order_template: orderTemplate }),
      child_unit_info: JSON.stringify(childUnitInfo),
    });
  };

  const marginNegative =
    newBasePrice != null && derivedCost != null && newBasePrice < derivedCost;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa giá</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{productName}</span>
            {productCode && (
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {productCode}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {phase === 'success' && result ? (
          /* ── Màn hình thành công ── */
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Đã cập nhật giá thành công trên KiotViet
              </span>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Giá cũ → Mới</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      label: 'Cost',
                      old: Number(result.master.old_cost),
                      new: Number(result.master.new_cost),
                    },
                    {
                      label: 'Giá bán chính (master)',
                      old: Number(result.master.old_baseprice),
                      new: Number(result.master.new_baseprice),
                    },
                    ...(result.children ?? []).map(c => ({
                      label: c.name,
                      old: Number(c.old_baseprice),
                      new: Number(c.new_baseprice),
                    })),
                  ].map(row => {
                    const diff = row.new - row.old;
                    return (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">
                          {row.label}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className="line-through text-muted-foreground">
                            {fmt(row.old)}
                          </span>{' '}
                          → <strong>{fmt(row.new)}</strong>
                        </TableCell>
                        <TableCell className="text-right">
                          {diff === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 ${
                                diff > 0
                                  ? 'text-destructive'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {diff > 0 ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {fmt(Math.abs(diff))}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1.5" />
                In bảng giá bán lẻ
              </Button>
              <Button onClick={onClose}>Đóng</Button>
            </div>
          </div>
        ) : phase === 'error' ? (
          /* ── Màn hình lỗi ── */
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Cập nhật giá thất bại</p>
                <p className="text-sm text-muted-foreground break-words">
                  {errorMsg}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button onClick={() => setPhase('input')}>Thử lại</Button>
            </div>
          </div>
        ) : (
          /* ── Màn hình nhập / đang cập nhật ── */
          <div className="space-y-4 py-2">
            {/* Chuỗi công thức — 1 input: Giá nhập PO */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap flex-1">
                  Giá nhập PO
                  {hasPo && (
                    <span className="font-mono text-xs">
                      {' '}
                      {calculateFromPo!.latest_purchase_order_code}
                    </span>
                  )}
                </span>
                <Input
                  inputMode="numeric"
                  placeholder="Nhập giá nhập"
                  value={poRawStr}
                  disabled={phase === 'updating'}
                  onChange={e =>
                    setPoRawStr(e.target.value.replace(/[^\d]/g, ''))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleUpdate();
                    }
                  }}
                  className="h-8 w-36 font-mono text-right"
                  autoFocus
                />
                {hasChange && calculateFromPo?.latest_raw_price != null && (
                  <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                    {fmt(calculateFromPo.latest_raw_price)}
                  </span>
                )}
              </div>
              {hasPo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex-1">+ extra PO/đơn vị</span>
                  <span className="font-mono w-36 text-right">
                    {fmt(extraPerUnit)}
                  </span>
                </div>
              )}
              {extraCost > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex-1">+ extra SP</span>
                  <span className="font-mono w-36 text-right">
                    {fmt(extraCost)}
                  </span>
                </div>
              )}
              <div className="border-t" />

              {/* Cost — tự derive, readonly */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap flex-1">
                  = Cost (đ/kg
                  {currentCost != null && (
                    <span className="font-normal">
                      {' '}
                      · hiện tại {fmt(currentCost)}
                    </span>
                  )}
                  )
                </span>
                {derivedCost != null &&
                currentCost != null &&
                derivedCost !== currentCost ? (
                  <span
                    className={`text-xs inline-flex items-center gap-0.5 whitespace-nowrap ${
                      derivedCost > currentCost
                        ? 'text-destructive'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    (
                    {derivedCost > currentCost ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {fmt(Math.abs(derivedCost - currentCost))})
                  </span>
                ) : null}
                <span className="font-mono w-36 text-right font-semibold">
                  {fmt(derivedCost)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex-1">
                  + markup {fmt(markup)} → tròn bước {fmt(roundStep)}
                </span>
                <span className="font-mono w-36 text-right font-bold text-foreground text-base">
                  = {fmt(newBasePrice)}
                </span>
              </div>
            </div>

            {/* Bảng kết quả */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Hiện tại</TableHead>
                    <TableHead className="text-right">Mới</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-help">
                          <TableCell className="font-medium">
                            <span className="inline-flex items-center gap-1">
                              Giá bán chính
                              <Info className="h-3 w-3 text-muted-foreground/60" />
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmt(basePrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {fmt(newBasePrice)}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${
                              newBasePrice != null && newBasePrice > basePrice
                                ? 'text-destructive'
                                : newBasePrice != null &&
                                    newBasePrice < basePrice
                                  ? 'text-green-600 dark:text-green-400'
                                  : ''
                            }`}
                          >
                            {newBasePrice != null
                              ? `${newBasePrice > basePrice ? '+' : ''}${fmt(newBasePrice - basePrice)}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs font-mono">
                          {fmt(derivedCost)} + {fmt(markup)} (markup) → tròn
                          bước {fmt(roundStep)} →{' '}
                          <strong>{fmt(newBasePrice)}</strong>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {computedChildren.map(cu => {
                    const diff =
                      cu.new_price != null
                        ? cu.new_price - cu.base_price
                        : null;
                    return (
                      <TooltipProvider key={cu.kiotviet_id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TableRow className="cursor-help">
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-1">
                                  {cu.full_name}
                                  <Info className="h-3 w-3 text-muted-foreground/60" />
                                </span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {fmt(cu.base_price)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-semibold">
                                {fmt(cu.new_price)}
                              </TableCell>
                              <TableCell
                                className={`text-right tabular-nums ${
                                  diff != null && diff > 0
                                    ? 'text-destructive'
                                    : diff != null && diff < 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : ''
                                }`}
                              >
                                {diff != null
                                  ? `${diff > 0 ? '+' : ''}${fmt(diff)}`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs font-mono">
                              ({fmt(derivedCost)} + {fmt(CHILD_MARKUP_PER_CV)})
                              × {cu.conversion_value} = {fmt(cu.new_price)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {marginNegative && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Giá bán {fmt(newBasePrice)} &lt; cost {fmt(derivedCost)} —
                margin âm!
              </div>
            )}
          </div>
        )}

        {(phase === 'input' || phase === 'updating') && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={phase === 'updating'}
            >
              Hủy
            </Button>
            <Button
              onClick={() => void handleUpdate()}
              disabled={!canSubmit || phase === 'updating'}
              title={
                !hasChange
                  ? 'Chưa có thay đổi — nhập Giá nhập PO mới để cập nhật'
                  : undefined
              }
            >
              {phase === 'updating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Đang cập nhật KV...
                </>
              ) : (
                'Cập nhật giá'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceEditDialog;
