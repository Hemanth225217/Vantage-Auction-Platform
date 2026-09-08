import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <Gavel size={40} className="mb-4 text-gold-400" />
    <h1 className="font-display text-4xl font-bold text-white">404</h1>
    <p className="mt-2 text-gray-400">
      This lot seems to have gone under the hammer already.
    </p>
    <Link to="/" className="btn-primary mt-6">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
