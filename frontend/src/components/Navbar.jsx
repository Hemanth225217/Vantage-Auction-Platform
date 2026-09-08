import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Gavel, Menu, X, Plus, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-gold-400' : 'text-gray-300 hover:text-white'
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 shadow-glow">
            <Gavel size={18} className="text-ink-950" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Vantage <span className="text-gradient-gold">Auctions</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/auctions" className={navLinkClass}>
            Auctions
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/create-auction" className="btn-secondary !px-4 !py-2">
                <Plus size={16} /> Sell an Item
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 hover:bg-white/10 transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-300">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200">{user.name.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-card">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
                    >
                      <User size={15} /> Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !px-4 !py-2">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">
                Join Now
              </Link>
            </>
          )}
        </div>

        <button
          className="text-gray-200 md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-ink-900 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <NavLink to="/" className={navLinkClass} end onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass} onClick={() => setOpen(false)}>
              Auctions
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/create-auction" className={navLinkClass} onClick={() => setOpen(false)}>
                  Sell an Item
                </NavLink>
                <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>
                  Profile
                </NavLink>
              </>
            )}
            <div className="mt-2 flex gap-3">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate('/');
                  }}
                  className="btn-secondary w-full"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
