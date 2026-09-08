import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Eye } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

const placeholderImg = (title) =>
  `https://picsum.photos/seed/${encodeURIComponent(title)}/600/450`;

const AuctionCard = ({ auction, index = 0 }) => {
  const image = auction.images?.[0] || placeholderImg(auction.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/auctions/${auction._id}`}
        className="group card-surface block overflow-hidden rounded-2xl transition-all hover:border-gold-400/30 hover:shadow-glow"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
          <img
            src={image}
            alt={auction.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="badge bg-ink-950/70 text-gold-300 backdrop-blur-sm">
              {auction.category}
            </span>
            {auction.status === 'ended' && (
              <span className="badge bg-gray-900/80 text-gray-300">Ended</span>
            )}
          </div>
          <div className="absolute right-3 top-3">
            <CountdownTimer endTime={auction.endTime} compact />
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-gray-300">
            <Eye size={12} /> {auction.views || 0}
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-display text-base font-semibold text-white group-hover:text-gold-300 transition-colors">
            {auction.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400">
            {auction.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Current Bid
              </div>
              <div className="font-display text-lg font-bold text-gold-300">
                {formatCurrency(auction.currentPrice)}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Gavel size={13} />
              {auction.totalBids || 0} bids
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AuctionCard;
