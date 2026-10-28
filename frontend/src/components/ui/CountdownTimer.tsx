import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  closingAt: string;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  closingAt,
  onExpire,
  size = 'md',
}) => {
  const calculateTime = (): TimeRemaining => {
    const target = new Date(closingAt).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, isExpired: false, totalSeconds };
  };

  const [time, setTime] = useState<TimeRemaining>(calculateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTime();
      setTime(updated);
      if (updated.isExpired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [closingAt]);

  if (time.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
        Auction Ended
      </span>
    );
  }

  const isUrgent = time.totalSeconds < 3600; // Under 1 hour

  if (size === 'sm') {
    return (
      <span
        className={`font-mono font-bold text-xs tracking-tight ${
          isUrgent ? 'text-red-600' : 'text-slate-800'
        }`}
      >
        {time.days > 0 && `${time.days}d `}
        {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:
        {String(time.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono font-bold ${
        isUrgent
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-slate-100 border border-slate-200 text-slate-900'
      } px-2.5 py-1 rounded text-xs`}
    >
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Ends:</span>
      <span>
        {time.days > 0 && <span className="mr-1">{time.days}d</span>}
        <span>{String(time.hours).padStart(2, '0')}h </span>
        <span>{String(time.minutes).padStart(2, '0')}m </span>
        <span>{String(time.seconds).padStart(2, '0')}s</span>
      </span>
    </div>
  );
};
