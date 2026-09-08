const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    images: [
      {
        type: String,
      },
    ],
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      default: function () {
        return this.startingPrice;
      },
    },
    bidIncrement: {
      type: Number,
      default: 1,
      min: 1,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    totalBids: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended', 'cancelled'],
      default: 'live',
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Used', 'Vintage', 'For Parts'],
      default: 'Used',
    },
    location: {
      type: String,
      default: 'Online',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

auctionSchema.index({ title: 'text', description: 'text' });
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ category: 1 });

auctionSchema.virtual('isEnded').get(function () {
  return new Date() > this.endTime;
});

auctionSchema.set('toJSON', { virtuals: true });
auctionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Auction', auctionSchema);
