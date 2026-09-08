require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

const run = async () => {
  await connectDB();

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Auction.deleteMany({}),
    Bid.deleteMany({}),
  ]);

  console.log('👤 Creating demo users...');
  const users = await User.create([
    { name: 'Demo User', email: 'demo@auction.com', password: 'password123' },
    { name: 'Ava Sinclair', email: 'ava@auction.com', password: 'password123' },
    { name: 'Marcus Chen', email: 'marcus@auction.com', password: 'password123' },
    { name: 'Isabella Rossi', email: 'isabella@auction.com', password: 'password123' },
    { name: 'Admin', email: 'admin@auction.com', password: 'admin123', role: 'admin' },
  ]);

  const [demo, ava, marcus, isabella] = users;

  const img = (seed) => `https://picsum.photos/seed/${seed}/900/700`;

  console.log('🏺 Creating auctions...');
  const auctionsData = [
    {
      title: 'Vintage Rolex Submariner 1968',
      description:
        'A rare, all-original 1968 Rolex Submariner in exceptional condition. Comes with box, papers, and service history. A true grail piece for any serious collector.',
      category: 'Watches',
      images: [img('rolex1'), img('rolex2')],
      startingPrice: 8500,
      bidIncrement: 250,
      seller: ava._id,
      endTime: hoursFromNow(30),
      condition: 'Vintage',
      featured: true,
    },
    {
      title: 'Original Abstract Oil Painting — "Reverie"',
      description:
        'A large-scale abstract oil on canvas by an emerging contemporary artist. Vivid color palette, gallery-ready with certificate of authenticity.',
      category: 'Art',
      images: [img('art1'), img('art2')],
      startingPrice: 1200,
      bidIncrement: 50,
      seller: marcus._id,
      endTime: hoursFromNow(18),
      condition: 'New',
      featured: true,
    },
    {
      title: 'MacBook Pro 16" M3 Max — Sealed',
      description:
        'Brand new, factory-sealed MacBook Pro 16-inch with M3 Max chip, 64GB unified memory, 2TB SSD. Never opened.',
      category: 'Electronics',
      images: [img('mac1'), img('mac2')],
      startingPrice: 2200,
      bidIncrement: 50,
      seller: isabella._id,
      endTime: hoursFromNow(48),
      condition: 'New',
      featured: true,
    },
    {
      title: '1965 Ford Mustang Fastback',
      description:
        'Fully restored 1965 Ford Mustang Fastback with matching numbers engine. New paint, upholstery, and mechanical overhaul completed in 2023.',
      category: 'Automobiles',
      images: [img('mustang1'), img('mustang2')],
      startingPrice: 35000,
      bidIncrement: 1000,
      seller: ava._id,
      endTime: daysFromNow(3),
      condition: 'Used',
      featured: true,
    },
    {
      title: 'Art Deco Diamond & Sapphire Necklace',
      description:
        'Exquisite 1920s Art Deco necklace featuring 4.2 carats of diamonds and natural sapphires set in platinum. Museum-quality piece.',
      category: 'Jewelry',
      images: [img('jewel1'), img('jewel2')],
      startingPrice: 12000,
      bidIncrement: 500,
      seller: marcus._id,
      endTime: hoursFromNow(60),
      condition: 'Vintage',
      featured: true,
    },
    {
      title: 'Complete Vintage Comic Book Collection',
      description:
        'A 40-piece collection of Silver Age comic books, all professionally graded and slabbed. Includes several key first appearances.',
      category: 'Collectibles',
      images: [img('comic1'), img('comic2')],
      startingPrice: 3000,
      bidIncrement: 100,
      seller: isabella._id,
      endTime: hoursFromNow(72),
      condition: 'Used',
      featured: true,
    },
    {
      title: 'Mid-Century Modern Walnut Sideboard',
      description:
        'Danish-made mid-century sideboard in solid walnut, professionally refinished. Sliding tambour doors, original hardware.',
      category: 'Furniture',
      images: [img('furniture1')],
      startingPrice: 900,
      bidIncrement: 25,
      seller: ava._id,
      endTime: hoursFromNow(40),
      condition: 'Used',
    },
    {
      title: 'Signed Michael Jordan Rookie Jersey',
      description:
        'Authenticated and signed Michael Jordan Chicago Bulls rookie-era jersey with COA from PSA/DNA.',
      category: 'Sports',
      images: [img('jersey1')],
      startingPrice: 5000,
      bidIncrement: 200,
      seller: marcus._id,
      endTime: hoursFromNow(20),
      condition: 'Used',
    },
    {
      title: 'Hermès Birkin 30 — Togo Leather',
      description:
        'Authentic Hermès Birkin 30 in black Togo leather with gold hardware. Includes dust bag, box, and authenticity cards.',
      category: 'Fashion',
      images: [img('birkin1')],
      startingPrice: 9500,
      bidIncrement: 250,
      seller: isabella._id,
      endTime: hoursFromNow(55),
      condition: 'Like New',
    },
    {
      title: 'Antique Persian Silk Rug, 9x12',
      description:
        'Hand-knotted antique Persian rug, silk on silk, intricate medallion design. Circa early 1900s, professionally cleaned and appraised.',
      category: 'Other',
      images: [img('rug1')],
      startingPrice: 4200,
      bidIncrement: 150,
      seller: ava._id,
      endTime: daysFromNow(2),
      condition: 'Vintage',
    },
  ];

  const createdAuctions = await Auction.create(auctionsData);

  console.log('💰 Placing some demo bids...');
  const bidders = [demo, ava, marcus, isabella];

  for (const auction of createdAuctions) {
    const numBids = Math.floor(Math.random() * 5) + 1;
    let price = auction.startingPrice;

    for (let i = 0; i < numBids; i++) {
      const bidder = bidders.filter(
        (b) => b._id.toString() !== auction.seller.toString()
      )[Math.floor(Math.random() * 3)];

      price += auction.bidIncrement * (Math.floor(Math.random() * 3) + 1);

      await Bid.create({
        auction: auction._id,
        bidder: bidder._id,
        amount: price,
      });

      auction.currentPrice = price;
      auction.highestBidder = bidder._id;
      auction.totalBids += 1;
    }

    await auction.save();
  }

  console.log('✅ Seed complete!');
  console.log('----------------------------------------');
  console.log('Demo login credentials:');
  console.log('  demo@auction.com / password123');
  console.log('  ava@auction.com / password123');
  console.log('  marcus@auction.com / password123');
  console.log('  isabella@auction.com / password123');
  console.log('  admin@auction.com / admin123 (role: admin)');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
