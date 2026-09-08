import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Gavel,
  Eye,
  MapPin,
  ShieldCheck,
  Trash2,
  Pencil,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CountdownTimer from '../components/CountdownTimer';
import Loader from '../components/Loader';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const placeholderImg = (title) =>
  `https://picsum.photos/seed/${encodeURIComponent(title || 'item')}/900/700`;

const AuctionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [ended, setEnded] = useState(false);
  const bidListRef = useRef(null);

  const fetchAuction = async () => {
    try {
      const res = await api.get(`/auctions/${id}`);
      setAuction(res.data.data.auction);
      setBids(res.data.data.bids);
      setEnded(
        res.data.data.auction.status !== 'live' ||
          new Date(res.data.data.auction.endTime) <= new Date()
      );
    } catch (err) {
      toast.error('Auction not found');
      navigate('/auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinAuction', id);

    const handleNewBid = (payload) => {
      if (payload.auctionId !== id) return;
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: payload.currentPrice,
              totalBids: payload.totalBids,
              highestBidder: payload.highestBidder,
            }
          : prev
      );
      setBids((prev) => [payload.bid, ...prev].slice(0, 30));
      toast(`${payload.bid.bidder?.name || 'Someone'} bid ${formatCurrency(payload.currentPrice)}`, {
        icon: '🔨',
      });
    };

    const handleEnded = (payload) => {
      if (payload.auctionId !== id) return;
      setEnded(true);
      setAuction((prev) => (prev ? { ...prev, status: 'ended' } : prev));
      toast('This auction has ended!', { icon: '⏰' });
    };

    socket.on('newBid', handleNewBid);
    socket.on('auctionEnded', handleEnded);

    return () => {
      socket.emit('leaveAuction', id);
      socket.off('newBid', handleNewBid);
      socket.off('auctionEnded', handleEnded);
    };
  }, [socket, id]);

  const minBid = auction ? auction.currentPrice + auction.bidIncrement : 0;

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to place a bid');
      navigate('/login', { state: { from: { pathname: `/auctions/${id}` } } });
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount < minBid) {
      toast.error(`Minimum bid is ${formatCurrency(minBid)}`);
      return;
    }

    setPlacingBid(true);
    try {
      await api.post(`/bids/${id}`, { amount });
      setBidAmount('');
      toast.success('Bid placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid');
      fetchAuction();
    } finally {
      setPlacingBid(false);
    }
  };

  const handleQuickBid = (increment) => {
    const base = auction.currentPrice + auction.bidIncrement;
    setBidAmount(String(base + increment));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this auction?')) return;
    try {
      await api.delete(`/auctions/${id}`);
      toast.success('Auction removed');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete auction');
    }
  };

  if (loading) return <Loader full label="Loading auction..." />;
  if (!auction) return null;

  const images = auction.images?.length ? auction.images : [placeholderImg(auction.title)];
  const isOwner = user && auction.seller?._id === user._id;
  const isHighestBidder =
    user && auction.highestBidder && auction.highestBidder._id === user._id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Images */}
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-ink-800">
            <img
              src={images[activeImage]}
              alt={auction.title}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-20 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === i ? 'border-gold-400' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="card-surface mt-8 rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-white">
              Item Description
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-400">
              {auction.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 sm:grid-cols-4">
              <div>
                <div className="text-xs text-gray-500">Condition</div>
                <div className="mt-1 text-sm font-medium text-gray-200">
                  {auction.condition}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Category</div>
                <div className="mt-1 text-sm font-medium text-gray-200">
                  {auction.category}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} /> Location
                </div>
                <div className="mt-1 text-sm font-medium text-gray-200">
                  {auction.location || 'Online'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye size={11} /> Views
                </div>
                <div className="mt-1 text-sm font-medium text-gray-200">
                  {auction.views}
                </div>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <div className="card-surface mt-6 flex items-center gap-4 rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-lg font-bold text-gold-300">
              {auction.seller?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                {auction.seller?.name}
                <ShieldCheck size={14} className="text-gold-400" />
              </div>
              <div className="text-xs text-gray-500">
                Seller · Member since{' '}
                {auction.seller?.createdAt
                  ? new Date(auction.seller.createdAt).getFullYear()
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Bid panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <div className="card-surface rounded-2xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="badge bg-gold-500/10 text-gold-300">
                  {auction.category}
                </span>
                {!ended && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                    Live now
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl font-bold leading-snug text-white">
                {auction.title}
              </h1>

              <div className="mt-5">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {ended ? 'Final Price' : 'Current Bid'}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={auction.currentPrice}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-4xl font-bold text-gold-300"
                  >
                    {formatCurrency(auction.currentPrice)}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Gavel size={12} /> {auction.totalBids} bids
                  </span>
                  {auction.highestBidder && (
                    <span>
                      Leading:{' '}
                      <span className="font-medium text-gray-300">
                        {isHighestBidder ? 'You' : auction.highestBidder.name}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="my-5 border-t border-white/5" />

              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                  {ended ? 'Ended' : 'Time Remaining'}
                </div>
                <CountdownTimer
                  endTime={auction.endTime}
                  onEnd={() => setEnded(true)}
                />
              </div>

              <div className="my-5 border-t border-white/5" />

              {ended ? (
                <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-300">
                  {auction.highestBidder ? (
                    <>
                      🏆 Won by{' '}
                      <span className="font-semibold text-gold-300">
                        {isHighestBidder ? 'you' : auction.highestBidder.name}
                      </span>{' '}
                      for {formatCurrency(auction.currentPrice)}
                    </>
                  ) : (
                    'This auction ended with no bids.'
                  )}
                </div>
              ) : isOwner ? (
                <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-400">
                  This is your listing — you can't bid on your own item.
                </div>
              ) : (
                <form onSubmit={handleBid} className="space-y-3">
                  <div className="flex gap-2">
                    {[0, auction.bidIncrement, auction.bidIncrement * 5].map(
                      (inc, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => handleQuickBid(inc)}
                          className="btn-secondary flex-1 !py-2 !text-xs"
                        >
                          {i === 0
                            ? `Min ${formatCurrency(minBid)}`
                            : `+${formatCurrency(inc)}`}
                        </button>
                      )
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={minBid}
                      step={auction.bidIncrement}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={String(minBid)}
                      className="input-field !pl-7 text-lg font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={placingBid}
                    className="btn-primary w-full !py-3 text-base"
                  >
                    <Gavel size={17} />
                    {placingBid ? 'Placing bid...' : 'Place Bid'}
                  </button>
                  {!user && (
                    <p className="text-center text-xs text-gray-500">
                      You'll need to{' '}
                      <Link to="/login" className="text-gold-400 underline">
                        sign in
                      </Link>{' '}
                      first.
                    </p>
                  )}
                </form>
              )}

              {isOwner && auction.totalBids === 0 && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/auctions/${id}/edit`)}
                    className="btn-secondary flex-1"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-secondary flex-1 !text-red-400"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Live bid history */}
            <div className="card-surface rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-white">
                <TrendingUp size={15} className="text-gold-400" />
                Bid History
              </h3>
              <div
                ref={bidListRef}
                className="max-h-72 space-y-3 overflow-y-auto pr-1"
              >
                <AnimatePresence initial={false}>
                  {bids.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">
                      No bids yet. Be the first!
                    </p>
                  ) : (
                    bids.map((b) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/15 text-[11px] font-bold text-gold-300">
                            {b.bidder?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="text-sm text-gray-300">
                            {user && b.bidder?._id === user._id
                              ? 'You'
                              : b.bidder?.name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gold-300">
                            {formatCurrency(b.amount)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {timeAgo(b.createdAt)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
