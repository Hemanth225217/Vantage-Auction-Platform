const path = require('path');
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const Auction = require('./models/Auction');

const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors({ origin: clientUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Auction Platform API is running 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);

app.use(notFound);
app.use(errorHandler);

// ---------- Socket.io: live auction rooms ----------
io.on('connection', (socket) => {
  socket.on('joinAuction', (auctionId) => {
    socket.join(`auction:${auctionId}`);
  });

  socket.on('leaveAuction', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
  });

  socket.on('disconnect', () => {
    // no-op, room membership is cleaned up automatically
  });
});

// ---------- Background job: auto-close ended auctions ----------
const closeExpiredAuctions = async () => {
  try {
    const now = new Date();
    const expired = await Auction.find({
      status: 'live',
      endTime: { $lte: now },
    });

    for (const auction of expired) {
      auction.status = 'ended';
      await auction.save();
      io.to(`auction:${auction._id}`).emit('auctionEnded', {
        auctionId: auction._id.toString(),
        winner: auction.highestBidder,
        finalPrice: auction.currentPrice,
      });
    }
  } catch (err) {
    console.error('Error closing expired auctions:', err.message);
  }
};

setInterval(closeExpiredAuctions, 15000); // check every 15s

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
