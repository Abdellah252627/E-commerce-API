import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/stats/by-category', async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          productCount: { $sum: 1 },
        },
      },
    ]);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, price, category } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'name, price, and category are required' });
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/stock', async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: 'amount is required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock + amount < 0) {
      return res.status(400).json({ message: 'Insufficient stock for this operation' });
    }

    product.stock += amount;
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
