/**
 * CurrencyInput — input text format theo VND (dấu chấm hàng nghìn), lưu giá trị số.
 * @module components/ui/currency-input
 */
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

const formatVnd = (n: number): string =>
  n ? Math.trunc(n).toLocaleString('vi-VN') : '';

export type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> & {
  value: number;
  onValueChange: (value: number) => void;
};

export const CurrencyInput = ({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) => {
  const [text, setText] = useState(formatVnd(value));

  // Sync khi value thay đổi từ ngoài (prefill, reset...)
  useEffect(() => {
    setText(formatVnd(value));
  }, [value]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={e => {
        const digits = e.target.value.replace(/[^\d]/g, '');
        const n = digits ? Number(digits) : 0;
        setText(formatVnd(n));
        onValueChange(n);
      }}
    />
  );
};
