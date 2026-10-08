const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const { predict, CATEGORIES, CONDITIONS } = require('../ml/pricePredictor');
const { getModel } = require('../ml/modelStore');

const notReady = (res, model) =>
  res.status(503).json({
    success: false,
    message: `Not enough sales history to train the price model yet (${model.trainingSamples}/${model.minimumSamples} completed auctions with bids).`,
    data: { ready: false, ...model },
  });

// @desc    Predict the final price of a draft listing
// @route   POST /api/ai/predict-price
// @access  Private
const predictListingPrice = asyncHandler(async (req, res) => {
  const { category, condition, startingPrice, bidIncrement, endTime, description, images } =
    req.body;

  if (!CATEGORIES.includes(category)) {
    res.status(400);
    throw new Error('A valid category is required');
  }
  if (condition && !CONDITIONS.includes(condition)) {
    res.status(400);
    throw new Error('Invalid condition');
  }
  if (!(Number(startingPrice) > 0)) {
    res.status(400);
    throw new Error('Starting price must be greater than 0');
  }
  if (!endTime || isNaN(new Date(endTime))) {
    res.status(400);
    throw new Error('A valid end time is required');
  }

  const model = await getModel();
  if (!model.ready) return notReady(res, model);

  const prediction = predict(model, {
    category,
    condition,
    startingPrice: Number(startingPrice),
    bidIncrement: Number(bidIncrement) || 1,
    startTime: new Date(),
    endTime,
    description,
    images,
  });

  res.json({ success: true, data: { ...prediction, metrics: model.metrics } });
});

// @desc    Predict the final price of an existing live auction
// @route   GET /api/ai/predict-price/:auctionId
// @access  Public
const predictAuctionPrice = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.auctionId).lean();
  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  const model = await getModel();
  if (!model.ready) return notReady(res, model);

  const prediction = predict(model, auction);
  res.json({
    success: true,
    data: {
      ...prediction,
      currentPrice: auction.currentPrice,
      aboveEstimate: auction.currentPrice > prediction.high,
      metrics: model.metrics,
    },
  });
});

// @desc    Price model status and cross-validated accuracy
// @route   GET /api/ai/model
// @access  Public
const getModelInfo = asyncHandler(async (req, res) => {
  const model = await getModel();
  const { ready, metrics, trainedAt, trainingSamples, minimumSamples } = model;
  res.json({
    success: true,
    data: ready
      ? { ready, algorithm: 'ridge regression', metrics, trainedAt }
      : { ready, trainingSamples, minimumSamples },
  });
});

module.exports = { predictListingPrice, predictAuctionPrice, getModelInfo };
