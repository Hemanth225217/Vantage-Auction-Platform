const test = require('node:test');
const assert = require('node:assert/strict');
const { train, predict, MIN_TRAINING_SAMPLES } = require('../ml/pricePredictor');

const DAY = 24 * 60 * 60 * 1000;

// Small deterministic generator so the tests never depend on Math.random.
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Completed auctions where Watches sell for ~2x their start and Other for ~1.2x.
const makeHistory = (n, seed = 7) => {
  const rand = lcg(seed);
  return Array.from({ length: n }, (_, i) => {
    const category = i % 2 === 0 ? 'Watches' : 'Other';
    const startingPrice = Math.round(100 + rand() * 900);
    const markup = (category === 'Watches' ? 2.0 : 1.2) * (0.9 + rand() * 0.2);
    const startTime = new Date(2026, 0, 1);
    return {
      category,
      condition: 'Used',
      startingPrice,
      bidIncrement: 10,
      description: 'x'.repeat(50 + Math.floor(rand() * 200)),
      images: ['a.jpg'],
      startTime,
      endTime: new Date(startTime.getTime() + 3 * DAY),
      currentPrice: Math.round(startingPrice * markup),
      totalBids: 1 + Math.floor(rand() * 10),
    };
  });
};

const listing = (category) => ({
  category,
  condition: 'Used',
  startingPrice: 500,
  bidIncrement: 10,
  description: 'x'.repeat(120),
  images: ['a.jpg'],
  endTime: new Date(Date.now() + 3 * DAY),
});

test('is not ready until there are enough completed sales with bids', () => {
  const history = makeHistory(MIN_TRAINING_SAMPLES + 5);
  history.slice(0, 10).forEach((a) => (a.totalBids = 0)); // unsold: must be ignored
  const model = train(history);
  assert.equal(model.ready, false);
  assert.equal(model.trainingSamples, MIN_TRAINING_SAMPLES - 5);
});

test('learns that a category sells further above its starting price', () => {
  const model = train(makeHistory(200));
  assert.equal(model.ready, true);
  const watch = predict(model, listing('Watches'));
  const other = predict(model, listing('Other'));
  assert.ok(watch.predictedPrice > other.predictedPrice);
  assert.ok(Math.abs(watch.predictedPrice / 500 - 2.0) < 0.2, `watch ${watch.predictedPrice}`);
  assert.ok(Math.abs(other.predictedPrice / 500 - 1.2) < 0.15, `other ${other.predictedPrice}`);
});

test('prediction interval is ordered and never below the starting price', () => {
  const model = train(makeHistory(200));
  for (const category of ['Watches', 'Other', 'Art']) {
    const p = predict(model, listing(category));
    assert.equal(p.confidenceLevel, 0.8);
    assert.ok(p.low >= 500);
    assert.ok(p.low <= p.predictedPrice && p.predictedPrice <= p.high);
    assert.ok(p.factors.length <= 3);
  }
});

test('training is deterministic', () => {
  const a = train(makeHistory(120));
  const b = train(makeHistory(120));
  assert.deepEqual(a.weights, b.weights);
  assert.deepEqual(a.metrics.cvMeanAbsPctError, b.metrics.cvMeanAbsPctError);
});
