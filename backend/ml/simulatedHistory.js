const mongoose = require('mongoose');

// Simulated sales history for the AI price predictor.
// The price model (ml/pricePredictor.js) learns from completed auctions. A
// fresh database has none, so seed.js adds SIMULATED past sales generated
// from the rules below. The model's accuracy on this data only shows it can
// recover these rules; real accuracy needs real sales history.
const HISTORY_SIZE = 150;

// mulberry32 PRNG with a fixed seed: same history every run
const rng = (() => {
  let s = 20240601;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const gaussian = () =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

const HISTORY_CATALOG = {
  // [min start price, max start price, typical uplift (log), example items]
  Art: [200, 15000, 0.45, ['Oil Painting', 'Limited Edition Print', 'Bronze Sculpture', 'Watercolor Landscape']],
  Watches: [300, 25000, 0.35, ['Omega Seamaster', 'Seiko Diver', 'Cartier Tank', 'Tudor Black Bay']],
  Electronics: [100, 4000, 0.12, ['Sony A7 III Camera', 'iPad Pro', 'DJI Drone', 'Gaming Laptop']],
  Collectibles: [50, 8000, 0.4, ['Pokémon Card Lot', 'First-Edition Book', 'Vintage Coin Set', 'Movie Prop']],
  Jewelry: [200, 20000, 0.3, ['Diamond Ring', 'Pearl Necklace', 'Gold Bracelet', 'Emerald Earrings']],
  Automobiles: [5000, 80000, 0.2, ['Porsche 911', 'Classic VW Beetle', 'BMW E30', 'Land Rover Defender']],
  Furniture: [100, 5000, 0.18, ['Eames Lounge Chair', 'Oak Dining Table', 'Teak Armchair', 'Art Deco Cabinet']],
  Fashion: [80, 12000, 0.25, ['Chanel Flap Bag', 'Vintage Leather Jacket', 'Gucci Loafers', 'Silk Scarf']],
  Sports: [50, 10000, 0.38, ['Signed Baseball', 'Game-Worn Jersey', 'Vintage Golf Clubs', 'Signed Football']],
  Other: [50, 6000, 0.22, ['Antique Clock', 'Rare Vinyl Record', 'Persian Rug', 'Vintage Guitar']],
};
const CONDITION_EFFECT = {
  New: 0.1,
  'Like New': 0.05,
  Used: 0,
  Vintage: 0.12,
  'For Parts': -0.15,
};

const buildSalesHistory = (sellers, bidders) => {
  const auctions = [];
  const bids = [];

  for (let i = 0; i < HISTORY_SIZE; i++) {
    const category = pick(Object.keys(HISTORY_CATALOG));
    const [minP, maxP, uplift, items] = HISTORY_CATALOG[category];
    const condition = pick(Object.keys(CONDITION_EFFECT));
    const seller = pick(sellers);

    const startingPrice = Math.round(minP * Math.exp(rng() * Math.log(maxP / minP)));
    const bidIncrement = Math.max(1, Math.round(startingPrice * (0.01 + rng() * 0.05)));
    const hours = 12 + rng() * 156; // half a day to a week
    const imageCount = 1 + Math.floor(rng() * 4);

    const logRatio =
      uplift +
      CONDITION_EFFECT[condition] +
      0.06 * Math.log(hours / 48) +
      0.03 * imageCount -
      0.05 * Math.log(bidIncrement / startingPrice / 0.03) +
      0.15 * gaussian();
    const steps = Math.max(
      1,
      Math.round((startingPrice * Math.exp(logRatio) - startingPrice) / bidIncrement)
    );
    const finalPrice = startingPrice + steps * bidIncrement;

    const endTime = new Date(Date.now() - (1 + rng() * 120) * 24 * 60 * 60 * 1000);
    const startTime = new Date(endTime - hours * 60 * 60 * 1000);
    const _id = new mongoose.Types.ObjectId();

    // A few bids climbing to the final price; the last one wins
    const eligible = bidders.filter((b) => b._id.toString() !== seller._id.toString());
    const numBids = Math.min(steps, 2 + Math.floor(rng() * 6));
    let winner = null;
    for (let b = 1; b <= numBids; b++) {
      winner = pick(eligible);
      const amount =
        b === numBids
          ? finalPrice
          : startingPrice + Math.round((steps * b) / numBids) * bidIncrement;
      bids.push({
        auction: _id,
        bidder: winner._id,
        amount,
        createdAt: new Date(startTime.getTime() + ((endTime - startTime) * b) / (numBids + 1)),
        updatedAt: endTime,
      });
    }

    auctions.push({
      _id,
      title: `${condition === 'Vintage' ? 'Vintage ' : ''}${pick(items)}`,
      description: Array.from(
        { length: 1 + Math.floor(rng() * 4) },
        () => `${condition} ${pick(items).toLowerCase()} from a past sale on Vantage.`
      ).join(' '),
      category,
      images: Array.from({ length: imageCount }, (_, k) => `https://picsum.photos/seed/hist${i}-${k}/900/700`),
      startingPrice,
      currentPrice: finalPrice,
      bidIncrement,
      seller: seller._id,
      highestBidder: winner._id,
      totalBids: numBids,
      startTime,
      endTime,
      status: 'ended',
      condition,
      location: 'Online',
      featured: false,
      views: Math.floor(rng() * 500),
      createdAt: startTime,
      updatedAt: endTime,
    });
  }

  return { auctions, bids };
};

module.exports = { HISTORY_SIZE, buildSalesHistory };
