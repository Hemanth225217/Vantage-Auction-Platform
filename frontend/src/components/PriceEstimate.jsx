import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

// Displays an AI price prediction from /api/ai/predict-price.
const PriceEstimate = ({ estimate, loading, error, label = 'AI Price Estimate' }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gold-400/20 bg-gold-500/5 p-4 text-sm text-gray-400">
        <Sparkles size={14} className="mr-1.5 inline animate-pulse text-gold-400" />
        Estimating price...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
        <Sparkles size={13} className="mr-1.5 inline text-gray-500" />
        {error}
      </div>
    );
  }

  if (!estimate) return null;

  const { predictedPrice, low, high, factors, metrics, aboveEstimate } = estimate;

  return (
    <div className="rounded-xl border border-gold-400/20 bg-gold-500/5 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gold-300">
        <Sparkles size={13} /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold text-white">
        {formatCurrency(predictedPrice)}
      </div>
      <div className="text-xs text-gray-400">
        Likely final price: {formatCurrency(low)} – {formatCurrency(high)} (80% range)
      </div>

      {aboveEstimate && (
        <div className="mt-2 text-xs text-green-400">
          Bidding has already passed the expected range.
        </div>
      )}

      {factors?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {factors.map((f) => (
            <li key={f.feature} className="flex items-center gap-1.5 text-xs text-gray-300">
              {f.direction === 'up' ? (
                <TrendingUp size={12} className="text-green-400" />
              ) : (
                <TrendingDown size={12} className="text-red-400" />
              )}
              <span className="capitalize">{f.feature}</span>
              <span className="text-gray-500">
                ({f.impactPct > 0 ? '+' : ''}
                {f.impactPct}%)
              </span>
            </li>
          ))}
        </ul>
      )}

      {metrics && (
        <p className="mt-3 text-[11px] leading-snug text-gray-500">
          Learned from {metrics.trainingSamples} past sales on Vantage · average error{' '}
          {Math.round(metrics.cvMeanAbsPctError * 100)}% on held-out sales.
        </p>
      )}
    </div>
  );
};

export default PriceEstimate;
