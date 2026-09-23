/**
 * Matcher giao dịch của 2 khách trả chậm ATY (aty q12, aty thu khoa huan).
 * Mirror logic f/kiotviet/lib/slow_pay.ts trên windmill — dùng cho filter
 * "ATY" trên trang Payments và về sau cho các thống kê nợ aty.
 *
 * Người gửi thực tế (audit 23/23 CK): NGUYEN VAN NGHIA (aty q12),
 * NGUYEN HONG TRUC (aty thu khoa huan); mô tả chứa ATY/TKH/...
 */

const ATY_KEYWORD_RE = /\b(ATY|TKH|THU KHOA HUAN|TAI NANG TRE|THU DAC DI)\b/;
const ATY_SENDERS = ['NGUYEN VAN NGHIA', 'NGUYEN HONG TRUC'];

export function normalizeRefText(s: unknown): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function isAtyPayment(ref: string | null | undefined): boolean {
  const n = normalizeRefText(ref);
  if (!n) return false;
  if (ATY_SENDERS.some(sender => n.includes(sender))) return true;
  return ATY_KEYWORD_RE.test(n);
}
