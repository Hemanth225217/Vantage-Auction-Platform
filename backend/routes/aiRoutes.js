const express = require('express');
const router = express.Router();
const {
  predictListingPrice,
  predictAuctionPrice,
  getModelInfo,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/model', getModelInfo);
router.post('/predict-price', protect, predictListingPrice);
router.get('/predict-price/:auctionId', predictAuctionPrice);

module.exports = router;
