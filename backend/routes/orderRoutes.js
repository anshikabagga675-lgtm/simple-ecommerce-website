const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const addressFields = ['fullName', 'email', 'phone', 'street', 'city', 'postalCode', 'country'];

router.use(authMiddleware);

router.post('/', async (req, res, next) => {
  const reserved = [];
  const clientRequestId = req.get('Idempotency-Key');
  try {
    if (typeof clientRequestId !== 'string' || clientRequestId.length < 16 || clientRequestId.length > 100 || !/^[a-zA-Z0-9-]+$/.test(clientRequestId)) {
      return res.status(400).json({ message: 'A valid checkout request key is required. Refresh checkout and try again.' });
    }
    const previousOrder = await Order.findOne({ user: req.user.id, clientRequestId });
    if (previousOrder) return res.json({ message: 'This demo order was already saved.', order: previousOrder });
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) return res.status(400).json({ message: 'Your order must contain between 1 and 50 items.' });
    if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) return res.status(400).json({ message: 'Delivery details are required.' });
    const addressLimits = { fullName: 100, email: 254, phone: 30, street: 150, city: 80, postalCode: 20, country: 80 };
    for (const field of addressFields) {
      if (typeof shippingAddress[field] !== 'string' || !shippingAddress[field].trim() || shippingAddress[field].trim().length > addressLimits[field]) {
        return res.status(400).json({ message: `Please provide valid ${field === 'postalCode' ? 'postal code' : field}.` });
      }
    }
    if (!emailPattern.test(shippingAddress.email.trim())) return res.status(400).json({ message: 'Enter a valid delivery email address.' });

    const quantities = new Map();
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return res.status(400).json({ message: 'Each item needs a valid product and quantity between 1 and 99.' });
      }
      const id = item.productId;
      quantities.set(id, (quantities.get(id) || 0) + item.quantity);
      if (quantities.get(id) > 99) return res.status(400).json({ message: 'A product quantity cannot exceed 99.' });
    }

    const orderItems = [];
    let total = 0;
    for (const [id, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!product) {
        const exists = await Product.exists({ _id: id });
        const error = new Error(exists ? 'There is not enough stock for one of these products. Your bag was not ordered.' : 'One of the products in your bag no longer exists.');
        error.status = 409;
        throw error;
      }
      reserved.push({ id, quantity });
      total += product.price * quantity;
      orderItems.push({ product: product._id, name: product.name, quantity, unitPrice: product.price });
    }

    const order = await Order.create({
      user: req.user.id,
      clientRequestId,
      items: orderItems,
      shippingAddress: Object.fromEntries(addressFields.map(field => [field, shippingAddress[field].trim()])),
      total: Math.round((total + Number.EPSILON) * 100) / 100
    });
    return res.status(201).json({ message: 'Demo order placed. No payment was collected.', order });
  } catch (error) {
    await Promise.all(reserved.map(item => Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } }))).catch(rollbackError => {
      console.error('Stock rollback failed after order error:', rollbackError.message);
    });
    if (error.code === 11000) {
      try {
        const previousOrder = await Order.findOne({ user: req.user.id, clientRequestId });
        if (previousOrder) return res.json({ message: 'This demo order was already saved.', order: previousOrder });
      } catch (lookupError) {
        return next(lookupError);
      }
    }
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
