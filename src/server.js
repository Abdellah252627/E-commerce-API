import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import initReplicaSet from './config/initReplicaSet.js';
import { logRequest, errorHandler } from './middleware/logger.js';
import productRoutes from './routes/productRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(logRequest);

app.use('/products', productRoutes);
app.use('/customers', customerRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

connectDB().then(async () => {
  await initReplicaSet();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

export default app;
