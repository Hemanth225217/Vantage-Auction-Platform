import { Gavel } from 'lucide-react';

const Loader = ({ full = false, label = 'Loading...' }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${
      full ? 'min-h-[60vh]' : 'py-16'
    }`}
  >
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div className="absolute h-full w-full animate-spin rounded-full border-2 border-gold-400/20 border-t-gold-400" />
      <Gavel size={20} className="text-gold-400" />
    </div>
    <span className="text-sm text-gray-400">{label}</span>
  </div>
);

export default Loader;
