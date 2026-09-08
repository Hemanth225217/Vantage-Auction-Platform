import { Link } from 'react-router-dom';
import { Gavel, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-700">
                <Gavel size={16} className="text-ink-950" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Vantage Auctions
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-gray-400">
              A world-class marketplace for rare art, timepieces, automobiles
              and collectibles — bid live, win big.
            </p>
            <div className="mt-5 flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-gold-400/50 hover:text-gold-400"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/auctions" className="hover:text-gold-400">All Auctions</Link></li>
              <li><Link to="/auctions?category=Art" className="hover:text-gold-400">Art</Link></li>
              <li><Link to="/auctions?category=Watches" className="hover:text-gold-400">Watches</Link></li>
              <li><Link to="/auctions?category=Automobiles" className="hover:text-gold-400">Automobiles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/dashboard" className="hover:text-gold-400">Dashboard</Link></li>
              <li><Link to="/create-auction" className="hover:text-gold-400">Sell an Item</Link></li>
              <li><Link to="/profile" className="hover:text-gold-400">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-gold-400">About</a></li>
              <li><a href="#" className="hover:text-gold-400">How Bidding Works</a></li>
              <li><a href="#" className="hover:text-gold-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Vantage Auctions. All rights reserved. Built with React, Node.js, Express & MongoDB.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
