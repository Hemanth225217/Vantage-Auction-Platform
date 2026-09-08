import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import EditAuction from './pages/EditAuction';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161b24',
            color: '#f3f4f6',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route
            path="/create-auction"
            element={
              <ProtectedRoute>
                <CreateAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/:id/edit"
            element={
              <ProtectedRoute>
                <EditAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
