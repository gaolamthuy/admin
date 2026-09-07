/**
 * Constants & helpers dùng chung cho kiểm đếm tiền mặt
 * (CashCountBoard, CashCountDialog)
 */

export const COLUMN_A = [1000, 2000, 5000, 10000, 20000] as const;
export const COLUMN_B = [50000, 100000, 200000, 500000] as const;
export const DENOMINATIONS: number[] = [...COLUMN_A, ...COLUMN_B];

export const NOTE_IMAGES: Record<number, string> = {
  1000: '/images/vnd/1k.jpeg',
  2000: '/images/vnd/2k.jpg',
  5000: '/images/vnd/5k.jpg',
  10000: '/images/vnd/10k.jpg',
  20000: '/images/vnd/20k.jpg',
  50000: '/images/vnd/50k.jpg',
  100000: '/images/vnd/100k.jpg',
  200000: '/images/vnd/200k.jpg',
  500000: '/images/vnd/500k.jpg',
};

// Khối tiền thối chuẩn đầu ca — sửa tại đây nếu muốn đổi tỷ lệ
// 10×100k + 10×50k + 15×20k + 20×10k = 2.000.000đ (55 tờ)
export const FLOAT_2M_TEMPLATE: Partial<Record<number, number>> = {
  100000: 10,
  50000: 10,
  20000: 15,
  10000: 20,
};

export const FLOAT_2M_TOTAL = Object.entries(FLOAT_2M_TEMPLATE).reduce(
  (s, [denom, n]) => s + Number(denom) * Number(n ?? 0),
  0
);

// Cỡ hiển thị ảnh tiền: 1 height chung cho mọi mệnh giá (h-24 = 96px, h-32 = 128px...)
export const NOTE_IMAGE_CLASS = 'h-24 w-auto';

export type CountMap = Partial<Record<number, number>>;

export function sanitizeMap(raw: unknown): CountMap {
  const result: CountMap = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const d of DENOMINATIONS) {
    const v = (raw as CountMap)[d];
    if (typeof v === 'number' && v >= 0 && Number.isInteger(v)) {
      result[d] = v;
    }
  }
  return result;
}

export function getProviderLabel(
  providerRaw: string | null | undefined
): string {
  const provider = (providerRaw ?? '').toLowerCase().trim();
  if (provider.includes('momo')) return 'MoMo';
  if (provider.includes('acb')) return 'ACB';
  if (provider.includes('vietcom') || provider.includes('vcb'))
    return 'Vietcombank';
  if (
    provider.includes('techcom') ||
    provider.includes('tcb') ||
    provider.includes('techcomb')
  )
    return 'Techcombank';
  return providerRaw || 'Khác';
}
