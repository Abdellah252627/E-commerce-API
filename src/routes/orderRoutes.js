import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/stats/by-status', async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/stats/best-selling-products', async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] },
          },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 },
    ]);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/details', async (req, res, next) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },
      { $unwind: '$customerInfo' },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/customer/:customerId', async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const session = await mongoose.startSession();
  let orderResult;
  try {
    const { customerId, items } = req.body;

    await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        throw new Error('Invalid customer ID');
      }

      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Order must have at least one item');
      }

      const orderItemsArray = [];

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for Product ${product.name}`);
        }

        orderItemsArray.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          priceAtOrder: product.price,
        });

        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      const totalAmount = orderItemsArray.reduce(
        (sum, item) => sum + item.priceAtOrder * item.quantity,
        0
      );

      const [newOrder] = await Order.create(
        [
          {
            customerId,
            items: orderItemsArray,
            totalAmount,
            status: 'pending',
          },
        ],
        { session }
      );

      orderResult = newOrder;
    });

    res.status(201).json(orderResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    await order.deleteOne();
    res.json({ message: 'Order cancelled and stock restored' });
  } catch (error) {
    next(error);
  }
});

export default router;