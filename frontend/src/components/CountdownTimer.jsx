import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const getTimeParts = (endTime) => {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, diff };
};

const pad = (n) => String(n).padStart(2, '0');

const CountdownTimer = ({ endTime, onEnd, compact = false }) => {
  const [parts, setParts] = useState(() => getTimeParts(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTimeParts(endTime);
      setParts(next);
      if (!next && onEnd) onEnd();
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!parts) {
    return (
      <span className="badge bg-gray-700/40 text-gray-300">
        <Clock size={12} /> Auction Ended
      </span>
    );
  }

  const urgent = parts.diff < 1000 * 60 * 60; // under 1 hour

  if (compact) {
    return (
      <span
        className={`badge ${
          urgent
            ? 'bg-red-500/15 text-red-400 animate-pulseGlow'
            : 'bg-gold-500/10 text-gold-300'
        }`}
      >
        <Clock size={12} />
        {parts.days > 0
          ? `${parts.days}d ${parts.hours}h left`
          : `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)} left`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {[
        { label: 'Days', value: parts.days },
        { label: 'Hrs', value: parts.hours },
        { label: 'Min', value: parts.minutes },
        { label: 'Sec', value: parts.seconds },
      ].map((p) => (
        <div
          key={p.label}
          className={`flex w-16 flex-col items-center rounded-lg border py-2 ${
            urgent
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-gold-400/20 bg-gold-500/5'
          }`}
        >
          <span
            className={`font-display text-xl font-bold ${
              urgent ? 'text-red-400' : 'text-gold-300'
            }`}
          >
            {pad(p.value)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-gray-400">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
