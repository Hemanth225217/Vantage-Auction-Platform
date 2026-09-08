const express = require('express');
const router = express.Router();
const {
  placeBid,
  getBidsForAuction,
  getMyBids,
} = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

router.get('/user/mine', protect, getMyBids);
router.get('/:auctionId', getBidsForAuction);
router.post('/:auctionId', protect, placeBid);

module.exports = router;
