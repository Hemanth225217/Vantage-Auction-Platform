import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../api/axios';
import AuctionCard from '../components/AuctionCard';
import Loader from '../components/Loader';

const CATEGORIES = [
  'All',
  'Art',
  'Watches',
  'Electronics',
  'Collectibles',
  'Jewelry',
  'Automobiles',
  'Furniture',
  'Fashion',
  'Sports',
  'Other',
];

const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'mostBids', label: 'Most Bids' },
];

const Auctions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const category = searchParams.get('category') || 'All';
  const status = searchParams.get('status') || 'live';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === 'All') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auctions', {
        params: { category, status, sort, search, page, limit: 12 },
      });
      setAuctions(res.data.data);
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, status, sort, search, page]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Live Auctions
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {pagination.total} item{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParam('search', e.currentTarget.value);
              }}
              onBlur={(e) => updateParam('search', e.currentTarget.value)}
              placeholder="Search auctions..."
              className="input-field !pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="btn-secondary sm:hidden"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside
          className={`w-full shrink-0 lg:block lg:w-64 ${
            showFilters ? 'block' : 'hidden'
          }`}
        >
          <div className="card-surface rounded-2xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white">
                Filters
              </h3>
              <button
                className="lg:hidden"
                onClick={() => setShowFilters(false)}
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </h4>
              <div className="flex flex-wrap gap-2">
                {['live', 'ended', 'All'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateParam('status', s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      status === s
                        ? 'bg-gold-500 text-ink-950'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Category
              </h4>
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateParam('category', c)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                      category === c
                        ? 'bg-gold-500/15 text-gold-300'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Sort By
              </h4>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <Loader label="Fetching auctions..." />
          ) : auctions.length === 0 ? (
            <div className="card-surface rounded-2xl p-12 text-center text-gray-400">
              No auctions match your filters. Try adjusting your search.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {auctions.map((a, i) => (
                  <AuctionCard key={a._id} auction={a} index={i} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                          p === pagination.page
                            ? 'bg-gold-500 text-ink-950'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auctions;
