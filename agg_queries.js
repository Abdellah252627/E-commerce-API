import mongoose from 'mongoose';

await mongoose.connect('mongodb://127.0.0.1:27017/ecommerceDB');

const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

console.log('=== 1. Group by status (sum totalAmount + count) ===');
const r1 = await Order.aggregate([
  { $group: { _id: '$status', totalAmount: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
]);
console.log(JSON.stringify(r1, null, 2));

console.log('\n=== 2. Group _id:null (avg + count) ===');
const r2 = await Order.aggregate([
  { $group: { _id: null, avgTotal: { $avg: '$totalAmount' }, count: { $sum: 1 } } }
]);
console.log(JSON.stringify(r2, null, 2));

console.log('\n=== 3. Sort + Limit (top 3 orders) ===');
const r3 = await Order.aggregate([
  { $sort: { totalAmount: -1 } },
  { $limit: 3 }
]);
console.log(JSON.stringify(r3, null, 2));

console.log('\n=== 4. Group by customerId (orderCount + totalSpent) + sort ===');
const r4 = await Order.aggregate([
  { $group: { _id: '$customerId', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
  { $sort: { totalSpent: -1 } }
]);
console.log(JSON.stringify(r4, null, 2));

console.log('\n=== 5. Match confirmed + Group by customerId ===');
const r5 = await Order.aggregate([
  { $match: { status: 'confirmed' } },
  { $group: { _id: '$customerId', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }
]);
console.log(JSON.stringify(r5, null, 2));

console.log('\n=== 6. Group by category (avgPrice + totalStock + count) ===');
const r6 = await Product.aggregate([
  { $group: { _id: '$category', avgPrice: { $avg: '$price' }, totalStock: { $sum: '$stock' }, productCount: { $sum: 1 } } }
]);
console.log(JSON.stringify(r6, null, 2));

console.log('\n=== 7. Group by category (maxPrice only) ===');
const r7 = await Product.aggregate([
  { $group: { _id: '$category', maxPrice: { $max: '$price' } } }
]);
console.log(JSON.stringify(r7, null, 2));

console.log('\n=== 8. Match stock<10 + sort + project ===');
const r8 = await Product.aggregate([
  { $match: { stock: { $lt: 10 } } },
  { $sort: { stock: 1 } },
  { $project: { name: 1, stock: 1, _id: 0 } }
]);
console.log(JSON.stringify(r8, null, 2));

await mongoose.disconnect();
console.log('\n=== All queries completed ===');
