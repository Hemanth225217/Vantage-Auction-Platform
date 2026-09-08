const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

// @desc    Get all auctions (with filters, search, sort, pagination)
// @route   GET /api/auctions
// @access  Public
const getAuctions = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    search,
    sort,
    page = 1,
    limit = 12,
    minPrice,
    maxPrice,
  } = req.query;

  const query = {};

  if (category && category !== 'All') query.category = category;
  if (status && status !== 'All') query.status = status;
  if (minPrice || maxPrice) {
    query.currentPrice = {};
    if (minPrice) query.currentPrice.$gte = Number(minPrice);
    if (maxPrice) query.currentPrice.$lte = Number(maxPrice);
  }
  if (search) {
    query.$text = { $search: search };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'endingSoon') sortOption = { endTime: 1 };
  if (sort === 'priceLow') sortOption = { currentPrice: 1 };
  if (sort === 'priceHigh') sortOption = { currentPrice: -1 };
  if (sort === 'mostBids') sortOption = { totalBids: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [auctions, total] = await Promise.all([
    Auction.find(query)
      .populate('seller', 'name avatar')
      .populate('highestBidder', 'name avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Auction.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: auctions.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: auctions,
  });
});

// @desc    Get featured auctions for homepage
// @route   GET /api/auctions/featured
// @access  Public
const getFeaturedAuctions = asyncHandler(async (req, res) => {
  let auctions = await Auction.find({ featured: true, status: 'live' })
    .populate('seller', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(6);

  if (auctions.length === 0) {
    auctions = await Auction.find({ status: 'live' })
      .populate('seller', 'name avatar')
      .sort({ totalBids: -1 })
      .limit(6);
  }

  res.json({ success: true, data: auctions });
});

// @desc    Get single auction with recent bid history
// @route   GET /api/auctions/:id
// @access  Public
const getAuctionById = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('seller', 'name avatar bio createdAt')
    .populate('highestBidder', 'name avatar');

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  auction.views += 1;
  await auction.save();

  const bids = await Bid.find({ auction: auction._id })
    .populate('bidder', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: { auction, bids } });
});

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private
const createAuction = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    images,
    startingPrice,
    bidIncrement,
    endTime,
    condition,
    location,
  } = req.body;

  if (!title || !description || !category || !startingPrice || !endTime) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  if (new Date(endTime) <= new Date()) {
    res.status(400);
    throw new Error('End time must be in the future');
  }

  const auction = await Auction.create({
    title,
    description,
    category,
    images: images && images.length ? images : [],
    startingPrice,
    currentPrice: startingPrice,
    bidIncrement: bidIncrement || 1,
    endTime,
    condition,
    location,
    seller: req.user._id,
    status: 'live',
  });

  res.status(201).json({ success: true, data: auction });
});

// @desc    Update auction (seller only, before any bids)
// @route   PUT /api/auctions/:id
// @access  Private
const updateAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (auction.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this auction');
  }

  if (auction.totalBids > 0) {
    res.status(400);
    throw new Error('Cannot edit an auction that already has bids');
  }

  const fields = [
    'title',
    'description',
    'category',
    'images',
    'startingPrice',
    'bidIncrement',
    'endTime',
    'condition',
    'location',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) auction[f] = req.body[f];
  });

  if (req.body.startingPrice !== undefined) {
    auction.currentPrice = req.body.startingPrice;
  }

  const updated = await auction.save();
  res.json({ success: true, data: updated });
});

// @desc    Cancel/delete auction (seller only, before any bids)
// @route   DELETE /api/auctions/:id
// @access  Private
const deleteAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (
    auction.seller.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this auction');
  }

  if (auction.totalBids > 0) {
    auction.status = 'cancelled';
    await auction.save();
    return res.json({ success: true, message: 'Auction cancelled' });
  }

  await auction.deleteOne();
  res.json({ success: true, message: 'Auction deleted' });
});

// @desc    Get auctions created by logged-in user
// @route   GET /api/auctions/user/mine
// @access  Private
const getMyAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find({ seller: req.user._id })
    .populate('highestBidder', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: auctions });
});

// @desc    Get all distinct categories
// @route   GET /api/auctions/meta/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = Auction.schema.path('category').enumValues;
  res.json({ success: true, data: categories });
});

module.exports = {
  getAuctions,
  getFeaturedAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  getMyAuctions,
  getCategories,
};
