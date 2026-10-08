// AI price predictor: estimates an auction's final selling price from its
// listing details. Ridge regression trained on this platform's own completed
// auctions (status "ended" with at least one bid). The model predicts
// log(finalPrice / startingPrice), i.e. how far above its starting price an
// item tends to sell, which keeps the target on a comparable scale across a
// $50 jersey and a $50,000 car.
//
// Pure JavaScript, no ML dependencies: with ~20 features the closed-form
// ridge solution is a tiny linear solve.

const CATEGORIES = [
  'Art',
  'Watches',
  'Electronics',
  'Collectibles',
  'Jewelry',
  'Automobiles',
  'Furniture',
  'Fashion',
  'Sports',
  'Other',
];
const CONDITIONS = ['New', 'Like New', 'Used', 'Vintage', 'For Parts'];

const MIN_TRAINING_SAMPLES = 20;
const LAMBDA = 1.0; // ridge penalty (on standardized features)
const CV_FOLDS = 5;
const Z_80 = 1.2816; // two-sided 80% interval

const HOUR = 60 * 60 * 1000;

// ---------- Feature engineering ----------

const durationHours = (a) => {
  const start = a.startTime ? new Date(a.startTime) : new Date();
  const end = new Date(a.endTime);
  return Math.max(1, (end - start) / HOUR);
};

// Numeric features; standardized before training.
const numericFeatures = (a) => {
  const start = Math.max(1, Number(a.startingPrice));
  const inc = Math.max(1, Number(a.bidIncrement) || 1);
  return [
    Math.log(start),
    Math.log(inc / start), // relative bid step
    Math.log(durationHours(a)),
    Math.log1p((a.description || '').length),
    Math.min((a.images || []).length, 5),
  ];
};
const NUMERIC_NAMES = [
  'log(starting price)',
  'bid increment ratio',
  'auction duration',
  'description length',
  'image count',
];

const oneHot = (value, options) => options.map((o) => (o === value ? 1 : 0));

const rawFeatures = (a) => [
  ...numericFeatures(a),
  ...oneHot(a.category, CATEGORIES),
  ...oneHot(a.condition || 'Used', CONDITIONS),
];

const FEATURE_NAMES = [
  ...NUMERIC_NAMES,
  ...CATEGORIES.map((c) => `category: ${c}`),
  ...CONDITIONS.map((c) => `condition: ${c}`),
];

const target = (a) => Math.log(a.currentPrice / Math.max(1, a.startingPrice));

// ---------- Linear algebra ----------

// Solves A x = b with Gaussian elimination + partial pivoting.
const solve = (A, b) => {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
};

// Fits ridge regression. Features are standardized and y is centered so the
// intercept is not penalized.
const fitRidge = (X, y, lambda = LAMBDA) => {
  const n = X.length;
  const d = X[0].length;

  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  X.forEach((row) => row.forEach((v, j) => (mean[j] += v / n)));
  X.forEach((row) => row.forEach((v, j) => (std[j] += (v - mean[j]) ** 2 / n)));
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j]) || 1;

  const Z = X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));
  const yMean = y.reduce((s, v) => s + v, 0) / n;

  const A = Array.from({ length: d }, () => new Array(d).fill(0));
  const b = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    const yc = y[i] - yMean;
    for (let j = 0; j < d; j++) {
      b[j] += Z[i][j] * yc;
      for (let k = j; k < d; k++) A[j][k] += Z[i][j] * Z[i][k];
    }
  }
  for (let j = 0; j < d; j++) {
    A[j][j] += lambda;
    for (let k = 0; k < j; k++) A[j][k] = A[k][j];
  }

  const weights = solve(A, b);
  return { weights, mean, std, intercept: yMean };
};

const predictRaw = (model, x) =>
  model.intercept +
  x.reduce((s, v, j) => s + model.weights[j] * ((v - model.mean[j]) / model.std[j]), 0);

// ---------- Training ----------

// Deterministic shuffle so CV metrics are stable between retrains.
const seededShuffle = (arr, seed = 42) => {
  const out = [...arr];
  let s = seed;
  const rand = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// k-fold cross-validation: gives honest, out-of-sample error estimates and the
// residual spread used for the prediction interval.
const crossValidate = (samples) => {
  const shuffled = seededShuffle(samples);
  const folds = Math.min(CV_FOLDS, shuffled.length);
  const residuals = [];
  let absPctErr = 0;
  let ssRes = 0;

  for (let f = 0; f < folds; f++) {
    const test = shuffled.filter((_, i) => i % folds === f);
    const train = shuffled.filter((_, i) => i % folds !== f);
    const model = fitRidge(train.map((s) => s.x), train.map((s) => s.y));
    for (const s of test) {
      const r = s.y - predictRaw(model, s.x);
      residuals.push(r);
      const predicted = s.start * Math.exp(s.y - r);
      const actual = s.start * Math.exp(s.y);
      absPctErr += Math.abs(predicted - actual) / actual;
      ssRes += (predicted - actual) ** 2;
    }
  }

  const n = residuals.length;
  const residualStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);

  const finals = samples.map((s) => s.start * Math.exp(s.y));
  const finalMean = finals.reduce((s, v) => s + v, 0) / n;
  const ssTot = finals.reduce((s, v) => s + (v - finalMean) ** 2, 0);

  return {
    residualStd,
    mape: absPctErr / n,
    r2: ssTot > 0 ? 1 - ssRes / ssTot : null,
  };
};

const train = (auctions) => {
  const samples = auctions
    .filter((a) => a.totalBids > 0 && a.startingPrice > 0 && a.currentPrice > 0)
    .map((a) => ({ x: rawFeatures(a), y: target(a), start: a.startingPrice }));

  if (samples.length < MIN_TRAINING_SAMPLES) {
    return {
      ready: false,
      trainingSamples: samples.length,
      minimumSamples: MIN_TRAINING_SAMPLES,
    };
  }

  const cv = crossValidate(samples);
  const model = fitRidge(samples.map((s) => s.x), samples.map((s) => s.y));

  return {
    ready: true,
    ...model,
    residualStd: cv.residualStd,
    metrics: {
      trainingSamples: samples.length,
      cvMeanAbsPctError: cv.mape,
      cvR2: cv.r2,
    },
    trainedAt: new Date(),
  };
};

// ---------- Prediction ----------

// Top features pushing this item's price up or down relative to an average
// listing, in plain-language terms.
const explain = (model, x, limit = 3) =>
  x
    .map((v, j) => ({
      feature: FEATURE_NAMES[j],
      effect: model.weights[j] * ((v - model.mean[j]) / model.std[j]),
    }))
    .filter((c) => Math.abs(c.effect) > 0.01)
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
    .slice(0, limit)
    .map((c) => ({
      feature: c.feature,
      direction: c.effect > 0 ? 'up' : 'down',
      impactPct: Math.round((Math.exp(c.effect) - 1) * 100),
    }));

const predict = (model, listing) => {
  const start = Math.max(1, Number(listing.startingPrice));
  const x = rawFeatures({ ...listing, startingPrice: start });
  const logRatio = predictRaw(model, x);
  const spread = Z_80 * model.residualStd;

  // An auction can never close below its starting price.
  const clamp = (v) => Math.max(start, Math.round(v));

  return {
    predictedPrice: clamp(start * Math.exp(logRatio)),
    low: clamp(start * Math.exp(logRatio - spread)),
    high: clamp(start * Math.exp(logRatio + spread)),
    confidenceLevel: 0.8,
    factors: explain(model, x),
  };
};

module.exports = {
  train,
  predict,
  CATEGORIES,
  CONDITIONS,
  MIN_TRAINING_SAMPLES,
};
