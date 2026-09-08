import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ImagePlus, X, Gavel } from 'lucide-react';
import api from '../api/axios';

const CATEGORIES = [
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
const CONDITIONS = ['New', 'Like New', 'Used', 'Vintage', 'For Parts'];

const defaultEndTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 16);
};

const CreateAuction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Art',
    images: [],
    startingPrice: '',
    bidIncrement: '10',
    endTime: defaultEndTime(),
    condition: 'Used',
    location: 'Online',
  });

  const addImage = () => {
    if (!imageUrl.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.startingPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auctions', {
        ...form,
        startingPrice: Number(form.startingPrice),
        bidIncrement: Number(form.bidIncrement),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success('Auction created successfully!');
      navigate(`/auctions/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 shadow-glow">
            <Gavel size={22} className="text-ink-950" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            List a New Auction
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Fill in the details below to start receiving bids
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface space-y-6 rounded-2xl p-8">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Item Title *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Vintage Rolex Submariner 1968"
              className="input-field"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Description *
            </label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the item's condition, history, and any notable details..."
              className="input-field resize-none"
              maxLength={2000}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Images (URLs)
            </label>
            <div className="flex gap-2">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="input-field"
              />
              <button type="button" onClick={addImage} className="btn-secondary shrink-0">
                <ImagePlus size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Paste image URLs — leave empty and we'll use a placeholder.
            </p>
            {form.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="input-field"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Starting Price ($) *
              </label>
              <input
                required
                type="number"
                min="1"
                value={form.startingPrice}
                onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                placeholder="100"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Bid Increment ($)
              </label>
              <input
                type="number"
                min="1"
                value={form.bidIncrement}
                onChange={(e) => setForm({ ...form, bidIncrement: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Auction End Date *
              </label>
              <input
                required
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Online"
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-base">
            {loading ? 'Publishing...' : 'Publish Auction'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAuction;
