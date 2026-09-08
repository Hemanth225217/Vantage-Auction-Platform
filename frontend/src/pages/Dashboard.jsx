import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Gavel, Package, TrendingUp, Trophy } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';
import Loader from '../components/Loader';
import CountdownTimer from '../components/CountdownTimer';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

const Dashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('selling');
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auctions/user/mine'),
      api.get('/bids/user/mine'),
    ])
      .then(([auctionsRes, bidsRes]) => {
        setMyAuctions(auctionsRes.data.data);
        setMyBids(bidsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    totalListings: myAuctions.length,
    activeListings: myAuctions.filter((a) => a.status === 'live').length,
    totalBidsPlaced: myBids.length,
    winning: myBids.filter(
      (b) =>
        b.auction?.status === 'live' &&
        b.auction?.highestBidder === user?._id
    ).length,
  };

  if (loading) return <Loader full label="Loading your dashboard..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your listings and track your bids
          </p>
        </div>
        <Link to="/create-auction" className="btn-primary">
          <Plus size={16} /> New Auction
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Package, label: 'Total Listings', value: stats.totalListings },
          { icon: TrendingUp, label: 'Active Listings', value: stats.activeListings },
          { icon: Gavel, label: 'Bids Placed', value: stats.totalBidsPlaced },
          { icon: Trophy, label: 'Currently Winning', value: stats.winning },
        ].map((s) => (
          <div key={s.label} className="card-surface rounded-2xl p-5">
            <s.icon size={18} className="mb-2 text-gold-400" />
            <div className="font-display text-2xl font-bold text-white">
              {s.value}
            </div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/5">
        {[
          { key: 'selling', label: 'My Auctions' },
          { key: 'bidding', label: 'My Bids' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-3 text-sm font-medium transition ${
              tab === t.key ? 'text-gold-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gold-400" />
            )}
          </button>
        ))}
      </div>

      {tab === 'selling' ? (
        myAuctions.length === 0 ? (
          <div className="card-surface rounded-2xl p-12 text-center text-gray-400">
            You haven't listed any auctions yet.{' '}
            <Link to="/create-auction" className="text-gold-400 underline">
              Create your first one
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {myAuctions.map((a, i) => (
              <AuctionCard key={a._id} auction={a} index={i} />
            ))}
          </div>
        )
      ) : myBids.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center text-gray-400">
          You haven't placed any bids yet.{' '}
          <Link to="/auctions" className="text-gold-400 underline">
            Browse live auctions
          </Link>
          .
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Current Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Time Left</th>
              </tr>
            </thead>
            <tbody>
              {myBids.map((b) => {
                const winning =
                  b.auction?.highestBidder === user?._id ||
                  b.auction?.highestBidder?._id === user?._id;
                return (
                  <tr
                    key={b._id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/auctions/${b.auction?._id}`}
                        className="flex items-center gap-3 font-medium text-gray-200 hover:text-gold-300"
                      >
                        <img
                          src={
                            b.auction?.images?.[0] ||
                            `https://picsum.photos/seed/${b.auction?._id}/80/80`
                          }
                          className="h-10 w-10 rounded-lg object-cover"
                          alt=""
                        />
                        <span className="line-clamp-1">{b.auction?.title}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gold-300">
                      {formatCurrency(b.auction?.currentPrice)}
                    </td>
                    <td className="px-5 py-4">
                      {b.auction?.status === 'live' ? (
                        <span
                          className={`badge ${
                            winning
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {winning ? 'Winning' : 'Outbid'}
                        </span>
                      ) : (
                        <span
                          className={`badge ${
                            winning
                              ? 'bg-gold-500/10 text-gold-300'
                              : 'bg-gray-700/40 text-gray-400'
                          }`}
                        >
                          {winning ? 'Won' : 'Lost'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {b.auction?.endTime ? (
                        <CountdownTimer endTime={b.auction.endTime} compact />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
