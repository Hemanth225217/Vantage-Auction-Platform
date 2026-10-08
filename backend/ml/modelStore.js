const Auction = require('../models/Auction');
const { train } = require('./pricePredictor');

// Keeps one trained model in memory. It retrains lazily when it is older than
// MAX_AGE_MS, or right away after auctions close (see invalidate()).
const MAX_AGE_MS = 10 * 60 * 1000;

let cached = null;
let cachedAt = 0;
let training = null;

const trainFromDatabase = async () => {
  const history = await Auction.find({ status: 'ended', totalBids: { $gt: 0 } })
    .select(
      'category condition startingPrice currentPrice bidIncrement startTime endTime description images totalBids'
    )
    .lean();
  return train(history);
};

const getModel = async () => {
  if (cached && Date.now() - cachedAt < MAX_AGE_MS) return cached;
  if (!training) {
    training = trainFromDatabase()
      .then((model) => {
        cached = model;
        cachedAt = Date.now();
        return model;
      })
      .finally(() => {
        training = null;
      });
  }
  return training;
};

const invalidate = () => {
  cachedAt = 0;
};

module.exports = { getModel, invalidate };
