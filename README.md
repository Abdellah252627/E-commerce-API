# E-commerce API

A simple e-commerce API built with Node.js, Express, and MongoDB.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or cloud)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/ecommerceDB
PORT=5000
```

## Running

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products (supports `category`, `minPrice`, `maxPrice`, `search` query params) |
| GET | `/products/stats/by-category` | Get product stats grouped by category |
| GET | `/products/:id` | Get a single product by ID |
| POST | `/products` | Create a new product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |
| PATCH | `/products/:id/stock` | Adjust product stock by amount |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List all customers |
| GET | `/customers/:id` | Get a single customer by ID |
| POST | `/customers` | Create a new customer |
| PUT | `/customers/:id` | Update a customer |
| DELETE | `/customers/:id` | Delete a customer |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders |
| GET | `/orders/stats/by-status` | Get order stats grouped by status |
| GET | `/orders/stats/best-selling-products` | Get top 5 best-selling products |
| GET | `/orders/:id` | Get a single order by ID |
| GET | `/orders/:id/details` | Get order details with customer info (lookup) |
| GET | `/orders/customer/:customerId` | Get all orders for a customer |
| POST | `/orders` | Create a new order (uses MongoDB transaction) |
| PATCH | `/orders/:id/status` | Update order status |
| DELETE | `/orders/:id` | Cancel an order and restore stock |

## Database Models

### Product

```js
{
  name: String (required),
  price: Number (required, min: 0),
  category: String (required),
  stock: Number (default: 0, min: 0),
  tags: [String]
}
```

### Customer

```js
{
  name: String (required),
  email: String (required, unique),
  address: String (default: '')
}
```

### Order

```js
{
  customerId: ObjectId (ref: Customer, required),
  items: [{
    productId: ObjectId (ref: Product, required),
    productName: String (required),
    quantity: Number (required, min: 1),
    priceAtOrder: Number (required)
  }],
  totalAmount: Number (default: 0),
  status: String (enum: pending, confirmed, shipped, delivered, cancelled, default: pending)
}
```

## Notes

- The POST `/orders` endpoint uses MongoDB transactions to ensure data consistency (stock check + decrement + order creation).
- For transactions to work, MongoDB must be running on a replica set.