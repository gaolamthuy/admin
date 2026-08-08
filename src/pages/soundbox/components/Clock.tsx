import { useState, useEffect } from 'react';

export function Clock({ variant = 'full' }: { variant?: 'full' | 'time' }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'time') {
    return <span className="tabular-nums">{time}</span>;
  }

  return (
    <div className="text-right">
      <div className="text-2xl font-bold tabular-nums text-foreground">{time}</div>
      <div className="text-xs text-muted-foreground capitalize">{date}</div>
    </div>
  );
}