const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

// @desc    Place a bid on an auction
// @route   POST /api/bids/:auctionId
// @access  Private
const placeBid = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;
  const { amount } = req.body;
  const io = req.app.get('io');

  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    res.status(400);
    throw new Error('Invalid auction id');
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid bid amount');
  }

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (auction.status !== 'live') {
    res.status(400);
    throw new Error('This auction is not currently live');
  }

  if (new Date() > auction.endTime) {
    auction.status = 'ended';
    await auction.save();
    res.status(400);
    throw new Error('This auction has already ended');
  }

  if (auction.seller.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot bid on your own auction');
  }

  const minRequired = auction.currentPrice + auction.bidIncrement;
  if (numericAmount < minRequired) {
    res.status(400);
    throw new Error(`Bid must be at least $${minRequired.toLocaleString()}`);
  }

  // Atomic update: only succeeds if currentPrice hasn't changed since we read it.
  // This prevents two simultaneous bids both "winning" (race condition safety).
  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      currentPrice: auction.currentPrice,
      status: 'live',
    },
    {
      $set: { currentPrice: numericAmount, highestBidder: req.user._id },
      $inc: { totalBids: 1 },
    },
    { new: true }
  );

  if (!updatedAuction) {
    res.status(409);
    throw new Error(
      'Someone just placed a higher bid. Please refresh and try again.'
    );
  }

  const bid = await Bid.create({
    auction: auctionId,
    bidder: req.user._id,
    amount: numericAmount,
  });

  const populatedBid = await bid.populate('bidder', 'name avatar');

  // Broadcast the new bid + updated price to everyone watching this auction room
  if (io) {
    io.to(`auction:${auctionId}`).emit('newBid', {
      auctionId,
      bid: populatedBid,
      currentPrice: updatedAuction.currentPrice,
      totalBids: updatedAuction.totalBids,
      highestBidder: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    });
  }

  res.status(201).json({
    success: true,
    data: {
      bid: populatedBid,
      auction: updatedAuction,
    },
  });
});

// @desc    Get bid history for an auction
// @route   GET /api/bids/:auctionId
// @access  Public
const getBidsForAuction = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ auction: req.params.auctionId })
    .populate('bidder', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bids });
});

// @desc    Get bids placed by logged-in user
// @route   GET /api/bids/user/mine
// @access  Private
const getMyBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ bidder: req.user._id })
    .populate({
      path: 'auction',
      select: 'title images currentPrice status endTime highestBidder',
    })
    .sort({ createdAt: -1 });

  // Deduplicate by auction, keep most recent bid per auction
  const seen = new Set();
  const uniqueByAuction = [];
  for (const b of bids) {
    if (!b.auction) continue;
    const id = b.auction._id.toString();
    if (!seen.has(id)) {
      seen.add(id);
      uniqueByAuction.push(b);
    }
  }

  res.json({ success: true, data: uniqueByAuction });
});

module.exports = { placeBid, getBidsForAuction, getMyBids };
