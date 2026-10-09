const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0, default: null },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  image: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 4.8 }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
