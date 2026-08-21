/**
 * Vietnamese number-to-words converter
 * Converts numbers to Vietnamese text (e.g., 1500000 -> "một triệu năm trăm nghìn")
 *
 * @module lib/numberToVietnamese
 */

const ones = [
  '',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
];

const tens = [
  '',
  'mười',
  'hai mươi',
  'ba mươi',
  'bốn mươi',
  'năm mươi',
  'sáu mươi',
  'bảy mươi',
  'tám mươi',
  'chín mươi',
];

const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ'];

function getHundreds(num: number): string {
  if (num === 0) return '';

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  let result = '';

  if (hundred > 0) {
    result += ones[hundred] + ' trăm';
  }

  if (remainder > 0) {
    if (hundred > 0) result += ' ';

    if (remainder < 10) {
      if (hundred > 0) {
        result += 'linh ' + ones[remainder];
      } else {
        result += ones[remainder];
      }
    } else if (remainder < 20) {
      result += 'mười ' + ones[remainder % 10];
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;

      if (one === 0) {
        result += tens[ten];
      } else {
        result += tens[ten] + ' ' + ones[one];
      }
    }
  }

  return result;
}

export function numberToVietnamese(num: number): string {
  if (num === 0) return 'không';

  if (num < 0) return 'âm ' + numberToVietnamese(-num);

  let result = '';
  let scaleIndex = 0;
  let remaining = num;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    remaining = Math.floor(remaining / 1000);

    if (chunk > 0) {
      const chunkText = getHundreds(chunk);
      const scaleText = scales[scaleIndex];

      if (result) {
        result = chunkText + ' ' + scaleText + ' ' + result;
      } else {
        result = chunkText + ' ' + scaleText;
      }
    } else if (remaining > 0 && chunk === 0) {
      if (result) {
        result = scales[scaleIndex] + ' ' + result;
      }
    }

    scaleIndex++;
  }

  result = result.trim();

  if (result.endsWith(' nghìn') && result !== 'nghìn') {
    result = result.replace(/ nghìn$/, ' nghìn không trăm');
  }

  return result;
}
