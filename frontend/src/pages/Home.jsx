import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Gavel,
  TrendingUp,
  Search,
} from 'lucide-react';
import api from '../api/axios';
import AuctionCard from '../components/AuctionCard';
import Loader from '../components/Loader';

const categories = [
  { name: 'Art', emoji: '🎨' },
  { name: 'Watches', emoji: '⌚' },
  { name: 'Automobiles', emoji: '🚗' },
  { name: 'Jewelry', emoji: '💎' },
  { name: 'Electronics', emoji: '💻' },
  { name: 'Collectibles', emoji: '🏺' },
  { name: 'Fashion', emoji: '👜' },
  { name: 'Furniture', emoji: '🪑' },
];

const stats = [
  { label: 'Active Bidders', value: '48K+' },
  { label: 'Items Sold', value: '12,500+' },
  { label: 'Total Value Transacted', value: '$210M+' },
  { label: 'Avg. Rating', value: '4.9/5' },
];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/auctions/featured')
      .then((res) => setFeatured(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-noise" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="badge mx-auto mb-6 w-fit border border-gold-400/30 bg-gold-500/10 text-gold-300">
              <Zap size={12} /> Live bidding, updated in real time
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Bid on the{' '}
              <span className="text-gradient-gold">world's finest</span>{' '}
              things
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-gray-400 sm:text-lg">
              Vantage Auctions connects collectors and sellers around the
              globe for live, secure bidding on rare art, watches,
              automobiles, jewelry and more.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/auctions?search=${encodeURIComponent(
                  search
                )}`;
              }}
              className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full border border-white/10 bg-ink-900/70 p-1.5 pl-5 backdrop-blur-sm"
            >
              <Search size={18} className="text-gray-500 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for watches, art, cars..."
                className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
              />
              <button type="submit" className="btn-primary !rounded-full shrink-0">
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auctions" className="btn-primary">
                Browse Live Auctions <ArrowRight size={16} />
              </Link>
              <Link to="/create-auction" className="btn-secondary">
                Start Selling
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            Browse by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/auctions?category=${c.name}`}
              className="card-surface flex flex-col items-center gap-2 rounded-xl p-4 text-center transition hover:border-gold-400/30 hover:-translate-y-1"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-medium text-gray-300">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured auctions */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Featured Live Auctions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Hand-picked lots ending soon — don't miss out.
            </p>
          </div>
          <Link
            to="/auctions"
            className="hidden items-center gap-1 text-sm font-medium text-gold-400 hover:text-gold-300 sm:flex"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <Loader label="Loading featured auctions..." />
        ) : featured.length === 0 ? (
          <div className="card-surface rounded-2xl p-10 text-center text-gray-400">
            No featured auctions yet. Check back soon, or{' '}
            <Link to="/create-auction" className="text-gold-400 underline">
              list the first one
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a, i) => (
              <AuctionCard key={a._id} auction={a} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Why us */}
      <section className="border-t border-white/5 bg-ink-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-white">
            Why Bid With Vantage
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Real-Time Bidding',
                desc: 'Every bid updates instantly across all devices, powered by a live socket connection — never miss a beat.',
              },
              {
                icon: ShieldCheck,
                title: 'Secure & Verified',
                desc: 'JWT-secured accounts and transparent bid history keep every auction fair, safe, and fully auditable.',
              },
              {
                icon: TrendingUp,
                title: 'Fair Market Pricing',
                desc: 'Competitive bidding surfaces true market value for every lot, benefiting both buyers and sellers.',
              },
            ].map((f) => (
              <div key={f.title} className="card-surface rounded-2xl p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
                  <f.icon size={20} />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="card-surface relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-radial-fade" />
          <div className="relative">
            <Gavel size={36} className="mx-auto mb-4 text-gold-400" />
            <h2 className="font-display text-3xl font-bold text-white">
              Have something extraordinary to sell?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-400">
              List your item in minutes and let competitive bidding find its
              true value.
            </p>
            <Link to="/create-auction" className="btn-primary mt-6 inline-flex">
              Start Your Auction <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
