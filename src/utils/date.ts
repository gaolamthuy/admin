import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Enable relativeTime plugin
dayjs.extend(relativeTime);
dayjs.locale('vi');

/**
 * Tính số ngày đã trôi qua từ một ngày đến hiện tại (trả về số)
 * @param date - Ngày cần tính (string, Date, hoặc dayjs object)
 * @returns Số ngày đã trôi qua (number), null nếu date không hợp lệ
 * @example
 * getDaysAgo('2025-01-01') // 5
 * getDaysAgo('2025-01-10') // 0 (hôm nay)
 */
export function getDaysAgo(
  date: string | Date | dayjs.Dayjs | null | undefined
): number | null {
  if (!date) return null;

  const targetDate = dayjs(date);
  if (!targetDate.isValid()) return null;

  const now = dayjs();
  return now.diff(targetDate, 'day');
}

/**
 * Tính số ngày đã trôi qua từ một ngày đến hiện tại
 * @param date - Ngày cần tính (string, Date, hoặc dayjs object)
 * @returns Chuỗi mô tả số ngày đã trôi qua bằng tiếng Việt
 * @example
 * formatDaysAgo('2025-01-01') // "5 ngày trước"
 * formatDaysAgo('2025-01-10') // "Hôm nay"
 * formatDaysAgo('2025-01-09') // "Hôm qua"
 */
export function formatDaysAgo(
  date: string | Date | dayjs.Dayjs | null | undefined
): string {
  if (!date) return '-';

  const targetDate = dayjs(date);
  const now = dayjs();
  const daysDiff = now.diff(targetDate, 'day');

  // Hôm nay
  if (daysDiff === 0) {
    return 'Hôm nay';
  }

  // Hôm qua
  if (daysDiff === 1) {
    return 'Hôm qua';
  }

  // 2-7 ngày trước
  if (daysDiff >= 2 && daysDiff <= 7) {
    return `${daysDiff} ngày trước`;
  }

  // 1-4 tuần trước
  const weeksDiff = Math.floor(daysDiff / 7);
  if (weeksDiff >= 1 && weeksDiff <= 4) {
    return weeksDiff === 1 ? '1 tuần trước' : `${weeksDiff} tuần trước`;
  }

  // 1-11 tháng trước
  const monthsDiff = now.diff(targetDate, 'month');
  if (monthsDiff >= 1 && monthsDiff <= 11) {
    return monthsDiff === 1 ? '1 tháng trước' : `${monthsDiff} tháng trước`;
  }

  // 1 năm trở lên
  const yearsDiff = now.diff(targetDate, 'year');
  if (yearsDiff >= 1) {
    return yearsDiff === 1 ? '1 năm trước' : `${yearsDiff} năm trước`;
  }

  // Fallback: dùng relativeTime của dayjs
  return targetDate.fromNow();
}

/**
 * Format ngày tháng theo định dạng Việt Nam
 * @param date - Ngày cần format
 * @param format - Format string (mặc định: 'DD/MM/YYYY')
 * @returns Chuỗi ngày tháng đã format
 */
export function formatDate(
  date: string | Date | dayjs.Dayjs | null | undefined,
  format = 'DD/MM/YYYY'
): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * Format ngày tháng kèm giờ theo định dạng Việt Nam
 * @param date - Ngày cần format
 * @returns Chuỗi ngày tháng giờ đã format
 */
export function formatDateTime(
  date: string | Date | dayjs.Dayjs | null | undefined
): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}
