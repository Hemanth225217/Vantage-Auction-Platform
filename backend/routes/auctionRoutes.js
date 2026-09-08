const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getFeaturedAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  getMyAuctions,
  getCategories,
} = require('../controllers/auctionController');
const { protect } = require('../middleware/auth');

router.get('/', getAuctions);
router.get('/featured', getFeaturedAuctions);
router.get('/meta/categories', getCategories);
router.get('/user/mine', protect, getMyAuctions);
router.get('/:id', getAuctionById);
router.post('/', protect, createAuction);
router.put('/:id', protect, updateAuction);
router.delete('/:id', protect, deleteAuction);

module.exports = router;
