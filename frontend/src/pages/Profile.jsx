import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Mail, FileText, Lock } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, bio: form.bio };
      if (form.password) payload.password = form.password;
      const res = await api.put('/auth/profile', payload);
      updateUser(res.data.data);
      setForm((f) => ({ ...f, password: '' }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/15 text-2xl font-bold text-gold-300">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {user?.name}
            </h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-surface space-y-5 rounded-2xl p-8">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field !pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Email (read-only)
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                disabled
                value={user?.email}
                className="input-field !pl-10 opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Bio
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-gray-500" />
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell other bidders a bit about yourself..."
                className="input-field !pl-10 resize-none"
                maxLength={300}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              New Password (leave blank to keep current)
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-field !pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
