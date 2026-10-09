require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');

const products = [
  { name: 'Sunday Ceramic Mug', category: 'Home & Living', price: 24, compareAtPrice: 28, stock: 28, rating: 4.9, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', description: 'A quietly beautiful ceramic mug for slow mornings and the first comforting cup of the day. Hand-finished with a soft, tactile glaze; each piece has its own subtle character.' },
  { name: 'Everyday Linen Tote', category: 'Accessories', price: 32, stock: 35, rating: 4.8, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85', description: 'A roomy, easy-going tote made for market mornings, library afternoons, and everything in between. Strong natural cotton with comfortable shoulder straps.' },
  { name: 'Stillwater Glass Bottle', category: 'On the Go', price: 28, stock: 22, rating: 4.7, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85', description: 'Keep a little refreshment close at hand. This reusable glass bottle has a protective silicone sleeve, a secure lid, and a clean shape that feels good to carry.' },
  { name: 'Soft Form Planter', category: 'Home & Living', price: 36, stock: 16, rating: 4.9, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85', description: 'A considered home for your favorite leafy friend. Its simple sculptural form and warm neutral finish pair beautifully with plants of every kind.' },
  { name: 'Little Ritual Candle', category: 'Wellness', price: 26, compareAtPrice: 31, stock: 30, rating: 4.8, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85', description: 'A gentle, grounding candle for making a moment out of an ordinary evening. Poured in a reusable glass vessel with a clean-burning cotton wick.' },
  { name: 'Weekend Market Basket', category: 'Accessories', price: 48, stock: 12, rating: 4.9, image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=85', description: 'An easygoing woven basket ready for a market wander or a day in the sun. Lightweight, roomy, and just as lovely tucked by the door.' },
  { name: 'Field Notes Journal', category: 'Stationery', price: 18, stock: 40, rating: 4.7, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85', description: 'A pocket-sized place for plans, small observations, and ideas you do not want to forget. Smooth uncoated pages and a sturdy, soft-touch cover.' },
  { name: 'Cloud Knit Throw', category: 'Home & Living', price: 68, stock: 9, rating: 5, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85', description: 'A soft layer for cool mornings and long evenings in. This textured knit throw brings comforting warmth and a relaxed, lived-in feel to any room.' },
  { name: 'Daily Carry Pouch', category: 'Accessories', price: 22, stock: 25, rating: 4.6, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85', description: 'A neatly sized pouch to keep the small essentials together, wherever the day goes. Durable cotton canvas with a smooth, dependable zip closure.' },
  { name: 'Sunday Serving Bowl', category: 'Home & Living', price: 42, stock: 14, rating: 4.9, image: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85', description: 'A versatile ceramic bowl for shared salads, fruit on the counter, or a favorite weeknight meal. A simple silhouette made to be reached for often.' },
  { name: 'The Everyday Overshirt', category: 'Clothing', price: 74, compareAtPrice: 88, stock: 18, rating: 4.8, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85', description: 'A versatile, soft-structured layer with a relaxed fit and considered details. Easy over a tee on cooler mornings, comfortable enough to wear all day.' },
  { name: 'Drift Knit Pullover', category: 'Clothing', price: 82, stock: 11, rating: 4.9, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85', description: 'A soft everyday knit with a gentle drape, ribbed cuffs, and an easy, unhurried shape. Made to be worn on repeat, season after season.' },
  { name: 'Everyday Court Sneaker', category: 'Footwear', price: 96, stock: 15, rating: 4.8, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', description: 'A clean, comfortable sneaker for errands that turn into adventures. A cushioned footbed and timeless shape make this an easy daily favorite.' },
  { name: 'Cloudstep House Slippers', category: 'Footwear', price: 38, stock: 21, rating: 4.7, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85', description: 'Give your at-home hours a softer landing. Plush lining, a light cushioned sole, and a simple slip-on shape make every slow morning better.' },
  { name: 'Little Light Table Lamp', category: 'Home & Living', price: 64, stock: 8, rating: 4.9, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', description: 'A warm pool of light for evening pages, bedside routines, and corners that need a little more atmosphere. Compact, sculptural, and easy to love.' },
  { name: 'Tidepool Travel Cup', category: 'On the Go', price: 34, compareAtPrice: 40, stock: 26, rating: 4.8, image: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?auto=format&fit=crop&w=900&q=85', description: 'Your everyday coffee, without the disposable cup. Double-wall insulation keeps drinks at their best, while a leak-resistant lid is ready for the commute.' }
];

async function seed() {
  try {
    await connectDB();
    const operations = products.map(({ stock, ...product }) => ({
      updateOne: {
        filter: { name: product.name },
        update: { $set: product, $setOnInsert: { stock } },
        upsert: true
      }
    }));
    const result = await Product.bulkWrite(operations, { ordered: true });
    console.log(`Seed complete. ${result.upsertedCount} added; ${result.modifiedCount} existing products refreshed.`);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
