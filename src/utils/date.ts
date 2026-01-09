/**
 * Date & Time Utilities
 * Các hàm tiện ích để xử lý ngày tháng và thời gian
 *
 * @module utils/date
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// ============================================
// SETUP & CONFIGURATION
// ============================================

// Enable plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('vi');

// ⭐ Database đã lưu UTC thực sự (kv_invoices, glt_payment đã được chuẩn hóa)
// VN_TIMEZONE chỉ dùng cho fallback hoặc các trường hợp đặc biệt
const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Parse date string to UTC (database returns UTC timestamps)
 * Tất cả date operations đều dùng UTC để đảm bảo chính xác
 * @param date - Date string or Date object (usually UTC from database)
 * @returns dayjs object in UTC
 */
function parseToUTC(
  date: string | Date | dayjs.Dayjs | null | undefined
): dayjs.Dayjs | null {
  if (!date) return null;
  
  // Nếu đã là dayjs object, convert về UTC
  if (dayjs.isDayjs(date)) {
    return date.utc();
  }
  
  // Nếu là Date object, parse trực tiếp
  if (date instanceof Date) {
    return dayjs.utc(date);
  }
  
  // Nếu là string, parse theo format từ database
  // ✅ Database đã lưu UTC thực sự (kv_invoices, glt_payment đã được chuẩn hóa)
  // Format: '2026-01-08 08:56:53.354+00' là UTC thực sự
  if (typeof date === 'string') {
    const dateStr = date.trim();
    
    // Detect timezone offset: +00, +00:00, -05:30, etc.
    const timezoneMatch = dateStr.match(/([+-]\d\d:?\d\d?)$/);
    const timezoneOffset = timezoneMatch ? timezoneMatch[1] : null;
    
    // Nếu có timezone offset là +00 hoặc +00:00, parse trực tiếp như UTC
    // dayjs.utc() có thể parse trực tiếp format '2026-01-08 08:56:53.354+00'
    if (timezoneOffset === '+00' || timezoneOffset === '+00:00') {
      const parsedAsUTC = dayjs.utc(dateStr);
      if (parsedAsUTC.isValid()) {
        return parsedAsUTC;
      }
    }
    
    // Nếu không có timezone hoặc timezone khác, thử parse như UTC
    // (vì database đã lưu UTC thực sự)
    let normalized = dateStr.replace(/[+-]\d\d:?\d\d?$/, '').trim();
    
    // Replace space với T để tạo ISO format
    if (normalized.includes(' ')) {
      normalized = normalized.replace(' ', 'T');
    }
    
    // Thử parse như UTC trước (database đã lưu UTC)
    const parsedAsUTC = dayjs.utc(normalized);
    if (parsedAsUTC.isValid()) {
      return parsedAsUTC;
    }
    
    // Fallback: parse với Date object (tự động detect timezone)
    try {
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        return dayjs.utc(dateObj);
      }
    } catch {
      // Ignore
    }
    
    // Fallback cuối cùng: parse như VN time rồi convert (chỉ để tương thích dữ liệu cũ)
    const fallback = dayjs.tz(normalized, VN_TIMEZONE);
    if (fallback.isValid()) {
      return fallback.utc();
    }
    
    return null;
  }
  
  return null;
}

// ============================================
// TIME AGO FUNCTIONS (Từ nhỏ đến lớn)
// ============================================

/**
 * Tính số giây đã trôi qua từ một thời điểm đến hiện tại
 * @param date - Thời điểm cần tính (string, Date, hoặc dayjs object)
 * @returns Số giây đã trôi qua (number), null nếu date không hợp lệ
 */
export function getSecondsAgo(
  date: string | Date | dayjs.Dayjs | null | undefined
): number | null {
  if (!date) return null;

  const targetDate = parseToUTC(date);
  if (!targetDate) return null;

  const now = dayjs.utc();
  return now.diff(targetDate, 'second');
}

/**
 * Tính số phút đã trôi qua từ một thời điểm đến hiện tại
 * @param date - Thời điểm cần tính (string, Date, hoặc dayjs object)
 * @returns Số phút đã trôi qua (number), null nếu date không hợp lệ
 */
export function getMinutesAgo(
  date: string | Date | dayjs.Dayjs | null | undefined
): number | null {
  if (!date) return null;

  const targetDate = parseToUTC(date);
  if (!targetDate) return null;

  const now = dayjs.utc();
  return now.diff(targetDate, 'minute');
}

/**
 * Tính số giờ đã trôi qua từ một thời điểm đến hiện tại
 * @param date - Thời điểm cần tính (string, Date, hoặc dayjs object)
 * @returns Số giờ đã trôi qua (number), null nếu date không hợp lệ
 */
export function getHoursAgo(
  date: string | Date | dayjs.Dayjs | null | undefined
): number | null {
  if (!date) return null;

  const targetDate = parseToUTC(date);
  if (!targetDate) return null;

  const now = dayjs.utc();
  return now.diff(targetDate, 'hour');
}

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

  const targetDate = parseToUTC(date);
  if (!targetDate) return null;

  const now = dayjs.utc();
  return now.diff(targetDate, 'day');
}

/**
 * Format thời gian đã trôi qua từ một thời điểm đến hiện tại
 * Cover đầy đủ từ giây -> phút -> giờ -> ngày -> tuần -> tháng -> năm
 * @param date - Thời điểm cần tính (string, Date, hoặc dayjs object)
 * @param options - Tùy chọn format
 * @param options.includeSeconds - Có hiển thị giây không (mặc định: true)
 * @param options.includeMinutes - Có hiển thị phút không (mặc định: true)
 * @param options.includeHours - Có hiển thị giờ không (mặc định: true)
 * @returns Chuỗi mô tả thời gian đã trôi qua bằng tiếng Việt
 * @example
 * formatTimeAgo('2025-01-10 10:00:00') // "Vừa xong" (nếu < 1 phút)
 * formatTimeAgo('2025-01-10 09:30:00') // "30 phút trước"
 * formatTimeAgo('2025-01-10 08:00:00') // "2 giờ trước"
 * formatTimeAgo('2025-01-09') // "Hôm qua"
 * formatTimeAgo('2025-01-01') // "5 ngày trước"
 */
export function formatTimeAgo(
  date: string | Date | dayjs.Dayjs | null | undefined,
  options: {
    includeSeconds?: boolean;
    includeMinutes?: boolean;
    includeHours?: boolean;
  } = {}
): string {
  const {
    includeSeconds = true,
    includeMinutes = true,
    includeHours = true,
  } = options;

  if (!date) return '-';

  const targetDate = parseToUTC(date);
  if (!targetDate) return '-';

  const now = dayjs.utc();

  // Tính các khoảng thời gian
  const secondsDiff = now.diff(targetDate, 'second');
  const minutesDiff = now.diff(targetDate, 'minute');
  const hoursDiff = now.diff(targetDate, 'hour');
  const daysDiff = now.diff(targetDate, 'day');
  const weeksDiff = Math.floor(daysDiff / 7);
  const monthsDiff = now.diff(targetDate, 'month');
  const yearsDiff = now.diff(targetDate, 'year');

  // ⚠️ Handle negative values (tương lai) - không nên xảy ra với transaction dates
  // Nhưng nếu có, hiển thị thông báo phù hợp
  if (secondsDiff < 0) {
    // Date trong tương lai - không nên xảy ra với latest_invoice_datetime
    // Nhưng để an toàn, return fallback (không dùng fromNow vì có thể trả về "tới")
    const absSeconds = Math.abs(secondsDiff);
    if (absSeconds < 60) return 'Vừa xong';
    if (absSeconds < 3600) return `${Math.floor(absSeconds / 60)} phút trước`;
    if (absSeconds < 86400) return `${Math.floor(absSeconds / 3600)} giờ trước`;
    return 'Hôm nay';
  }

  // Giây (chỉ hiển thị nếu < 1 phút và includeSeconds = true)
  if (includeSeconds && secondsDiff < 60) {
    if (secondsDiff < 10) return 'Vừa xong';
    if (secondsDiff < 30) return `${secondsDiff} giây trước`;
    return 'Vài giây trước';
  }

  // Phút (chỉ hiển thị nếu < 1 giờ và includeMinutes = true)
  if (includeMinutes && minutesDiff < 60) {
    if (minutesDiff === 1) return '1 phút trước';
    return `${minutesDiff} phút trước`;
  }

  // Giờ (chỉ hiển thị nếu < 24 giờ và includeHours = true)
  // ⚠️ Quan trọng: Kiểm tra giờ trước ngày để đảm bảo hiển thị chính xác
  // Ví dụ: 23 giờ trước vẫn hiển thị "23 giờ trước" thay vì "Hôm qua"
  if (includeHours && hoursDiff < 24) {
    if (hoursDiff === 1) return '1 giờ trước';
    return `${hoursDiff} giờ trước`;
  }

  // Ngày
  // ⚠️ Chỉ hiển thị "Hôm nay" nếu đã qua >= 24 giờ hoặc không includeHours
  if (daysDiff === 0) {
    // Nếu không includeHours và cùng ngày, hiển thị "Hôm nay"
    // Nếu includeHours nhưng hoursDiff >= 24, thì daysDiff sẽ >= 1, không vào đây
    return 'Hôm nay';
  }
  if (daysDiff === 1) return 'Hôm qua';
  if (daysDiff >= 2 && daysDiff <= 7) {
    return `${daysDiff} ngày trước`;
  }

  // Tuần
  if (weeksDiff >= 1 && weeksDiff <= 4) {
    return weeksDiff === 1 ? '1 tuần trước' : `${weeksDiff} tuần trước`;
  }

  // Tháng
  if (monthsDiff >= 1 && monthsDiff <= 11) {
    return monthsDiff === 1 ? '1 tháng trước' : `${monthsDiff} tháng trước`;
  }

  // Năm
  if (yearsDiff >= 1) {
    return yearsDiff === 1 ? '1 năm trước' : `${yearsDiff} năm trước`;
  }

  // Fallback: dùng relativeTime của dayjs
  return targetDate.fromNow();
}

/**
 * Format số ngày đã trôi qua từ một ngày đến hiện tại
 * @deprecated Sử dụng formatTimeAgo() thay thế để có đầy đủ từ giây đến năm
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
  // Gọi formatTimeAgo với options để chỉ hiển thị từ ngày trở lên
  return formatTimeAgo(date, {
    includeSeconds: false,
    includeMinutes: false,
    includeHours: false,
  });
}

// ============================================
// DATE FORMAT FUNCTIONS
// ============================================

/**
 * Format ngày tháng theo định dạng Việt Nam
 * Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) trước khi format
 * @param date - Ngày cần format (UTC từ database)
 * @param format - Format string (mặc định: 'DD/MM/YYYY')
 * @returns Chuỗi ngày tháng đã format theo giờ Việt Nam
 * @example
 * formatDate('2025-01-10T00:00:00Z') // "10/01/2025" (đã convert sang GMT+7)
 * formatDate('2025-01-10', 'DD-MM-YYYY') // "10-01-2025"
 */
export function formatDate(
  date: string | Date | dayjs.Dayjs | null | undefined,
  format = 'DD/MM/YYYY'
): string {
  if (!date) return '-';
  const d = parseToUTC(date);
  if (!d) return '-';
  // Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) rồi format
  return d.tz(VN_TIMEZONE).format(format);
}

/**
 * Format ngày tháng kèm giờ theo định dạng Việt Nam
 * Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) trước khi format
 * @param date - Ngày cần format (UTC từ database)
 * @returns Chuỗi ngày tháng giờ đã format (DD/MM/YYYY HH:mm) theo giờ Việt Nam
 * @example
 * formatDateTime('2025-01-10T14:30:00Z') // "10/01/2025 21:30" (đã convert sang GMT+7)
 */
export function formatDateTime(
  date: string | Date | dayjs.Dayjs | null | undefined
): string {
  if (!date) return '-';
  const d = parseToUTC(date);
  if (!d) return '-';
  // Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) rồi format
  return d.tz(VN_TIMEZONE).format('DD/MM/YYYY HH:mm');
}

/**
 * Format ngày tháng kèm giờ và giây theo định dạng Việt Nam
 * Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) trước khi format
 * @param date - Ngày cần format (UTC từ database)
 * @returns Chuỗi ngày tháng giờ giây đã format (DD/MM/YYYY HH:mm:ss) theo giờ Việt Nam
 * @example
 * formatDateTimeWithSeconds('2025-01-10T14:30:45Z') // "10/01/2025 21:30:45" (đã convert sang GMT+7)
 */
export function formatDateTimeWithSeconds(
  date: string | Date | dayjs.Dayjs | null | undefined
): string {
  if (!date) return '-';
  const d = parseToUTC(date);
  if (!d) return '-';
  // Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) rồi format
  return d.tz(VN_TIMEZONE).format('DD/MM/YYYY HH:mm:ss');
}

/**
 * Format chỉ giờ theo định dạng Việt Nam
 * Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) trước khi format
 * @param date - Ngày cần format (UTC từ database)
 * @returns Chuỗi giờ đã format (HH:mm) theo giờ Việt Nam
 * @example
 * formatTime('2025-01-10T14:30:00Z') // "21:30" (đã convert sang GMT+7)
 */
export function formatTime(
  date: string | Date | dayjs.Dayjs | null | undefined
): string {
  if (!date) return '-';
  const d = parseToUTC(date);
  if (!d) return '-';
  // Convert từ UTC sang GMT+7 (Asia/Ho_Chi_Minh) rồi format
  return d.tz(VN_TIMEZONE).format('HH:mm');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Kiểm tra xem một ngày có hợp lệ không
 * @param date - Ngày cần kiểm tra
 * @returns true nếu hợp lệ, false nếu không
 */
export function isValidDate(
  date: string | Date | dayjs.Dayjs | null | undefined
): boolean {
  if (!date) return false;
  return dayjs(date).isValid();
}

/**
 * So sánh hai ngày
 * @param date1 - Ngày thứ nhất
 * @param date2 - Ngày thứ hai
 * @returns -1 nếu date1 < date2, 0 nếu bằng, 1 nếu date1 > date2
 */
export function compareDates(
  date1: string | Date | dayjs.Dayjs | null | undefined,
  date2: string | Date | dayjs.Dayjs | null | undefined
): number {
  // Handle null/undefined: null < valid date
  if (!date1 && !date2) return 0;
  if (!date1) return 1; // date1 is null, put it after
  if (!date2) return -1; // date2 is null, put it after

  const d1 = parseToUTC(date1);
  const d2 = parseToUTC(date2);

  // Handle invalid dates: invalid < valid
  if (!d1 && !d2) return 0;
  if (!d1) return 1; // d1 is invalid, put it after
  if (!d2) return -1; // d2 is invalid, put it after

  if (d1.isBefore(d2)) return -1;
  if (d1.isAfter(d2)) return 1;
  return 0;
}
