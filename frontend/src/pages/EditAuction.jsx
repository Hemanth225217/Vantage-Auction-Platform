import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, X, ImagePlus } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

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

const EditAuction = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState(null);

  useEffect(() => {
    api
      .get(`/auctions/${id}`)
      .then((res) => {
        const a = res.data.data.auction;
        if (a.seller._id !== user?._id) {
          toast.error('Not authorized to edit this auction');
          navigate('/dashboard');
          return;
        }
        if (a.totalBids > 0) {
          toast.error('Cannot edit an auction that already has bids');
          navigate(`/auctions/${id}`);
          return;
        }
        setForm({
          title: a.title,
          description: a.description,
          category: a.category,
          images: a.images || [],
          startingPrice: a.startingPrice,
          bidIncrement: a.bidIncrement,
          endTime: new Date(a.endTime).toISOString().slice(0, 16),
          condition: a.condition,
          location: a.location,
        });
      })
      .catch(() => {
        toast.error('Auction not found');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [id]);

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
    setSaving(true);
    try {
      await api.put(`/auctions/${id}`, {
        ...form,
        startingPrice: Number(form.startingPrice),
        bidIncrement: Number(form.bidIncrement),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success('Auction updated');
      navigate(`/auctions/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update auction');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Loader full label="Loading auction..." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 shadow-glow">
          <Pencil size={20} className="text-ink-950" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">
          Edit Auction
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card-surface space-y-6 rounded-2xl p-8">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Description *</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Images</label>
          <div className="flex gap-2">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-field"
            />
            <button type="button" onClick={addImage} className="btn-secondary shrink-0">
              <ImagePlus size={16} />
            </button>
          </div>
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
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="input-field"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Starting Price ($)</label>
            <input
              type="number"
              min="1"
              value={form.startingPrice}
              onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Bid Increment ($)</label>
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
            <label className="mb-1.5 block text-xs font-medium text-gray-400">End Date</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3 text-base">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditAuction;
