const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    return res.json(categories.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.category === 'string' && req.query.category.trim()) filter.category = req.query.category.trim();
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const escaped = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } }
      ];
    }
    const sortOptions = {
      newest: { createdAt: -1 },
      popular: { rating: -1, createdAt: -1 },
      'price-asc': { price: 1, createdAt: -1 },
      'price-desc': { price: -1, createdAt: -1 },
      'name-asc': { name: 1 },
      rating: { rating: -1, createdAt: -1 }
    };
    const sort = typeof req.query.sort === 'string' && sortOptions[req.query.sort] ? sortOptions[req.query.sort] : sortOptions.newest;
    const products = await Product.find(filter).sort(sort).limit(100);
    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Product ID is invalid.' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
