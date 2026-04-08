// index.js - Express REST API server for the Estore application

const dns = require('dns');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images')));

// MongoDB Setup 
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'mummycome12';
const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://Estore:${MONGO_PASSWORD}@cluster0.ys7mw.mongodb.net/?retryWrites=true&w=majority`;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'Estore';
const client = new MongoClient(MONGO_URI);

// Helper Functions for certain common tasks like email validation, user lookup, etc..

// Validates email format using a regex pattern
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Creates a base64 token from a user ID
function createToken(userId) {
  return Buffer.from(userId.toString()).toString('base64');
}

// Decodes a base64 token back to a user ID
function verifyToken(token) {
  try { return Buffer.from(token, 'base64').toString('utf8'); } catch { return null; }
}

// Looks up a user in the database from a token
async function getUserFromToken(token) {
  const userId = verifyToken(token);
  if (!userId || !ObjectId.isValid(userId)) return null;
  return await client.db(MONGO_DB_NAME).collection('users').findOne({ _id: new ObjectId(userId) });
}

// Middleware that protects routes by verifying the Bearer token
function authMiddleware(req, res, next) {
  const authHeader = (req.headers.authorization || '').trim();
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing authorization token' });

  getUserFromToken(match[1])
    .then((user) => {
      if (!user) return res.status(401).json({ error: 'Invalid token' });
      req.user = user;
      next();
    })
    .catch((err) => {
      console.error('Auth error', err);
      res.status(500).json({ error: 'Unable to verify token' });
    });
}

//##### User Routes #####

// POST /api/users - Registers a new user
app.post('/api/users', async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Please fill out all required fields.' });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email.' });

  try {
    const collection = client.db(MONGO_DB_NAME).collection('users');
    const existingUser = await collection.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(409).json({ error: 'Email already exists.' });

    const result = await collection.insertOne({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim() || '',
      cart: [],
      createdAt: new Date(),
    });

    res.status(201).json({ id: result.insertedId, token: createToken(result.insertedId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to create user.' });
  }
});

// POST /api/login - Logs in a user and returns a token
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const user = await client.db(MONGO_DB_NAME).collection('users').findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      token: createToken(user._id),
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to login.' });
  }
});

// GET /api/me - Returns the currently logged in user's details
app.get('/api/me', authMiddleware, (req, res) => {
  const { _id, first_name, last_name, email, phone, cart } = req.user;
  res.json({ id: _id, first_name, last_name, email, phone, cart: cart || [] });
});

//##### Cart Routes #####

// GET /api/cart - Fetches the current user's cart
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const userCart = await client.db(MONGO_DB_NAME).collection('Cart').findOne({ userId: req.user._id });
    res.json({ cart: userCart?.items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch cart.' });
  }
});

// POST /api/cart - Adds or updates an item in the cart and adjusts stock
app.post('/api/cart', authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Valid productId and quantity required.' });
  }

  try {
    const db = client.db(MONGO_DB_NAME);
    const itemsCollection = db.collection('Items');
    const cartCollection = db.collection('Cart');

    const product = await itemsCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    let userCart = await cartCollection.findOne({ userId });
    if (!userCart) userCart = { userId, items: [] };

    const items = userCart.items || [];
    const existingItem = items.find((i) => i.productId === productId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const diff = quantity - currentQtyInCart;

    if (diff > 0 && product.stock < diff) {
      return res.status(400).json({ error: `Not enough stock. Only ${product.stock} left.` });
    }

    await itemsCollection.updateOne({ _id: new ObjectId(productId) }, { $inc: { stock: -diff } });

    if (existingItem) {
      const idx = items.findIndex((i) => i.productId === productId);
      items[idx].quantity = quantity;
    } else {
      items.push({ productId, quantity });
    }

    await cartCollection.updateOne({ userId }, { $set: { items } }, { upsert: true });
    res.json({ cart: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to update cart.' });
  }
});

// DELETE /api/cart/:productId - Removes a single item from the cart and restores stock
app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const db = client.db(MONGO_DB_NAME);
    const cartCollection = db.collection('Cart');
    const itemsCollection = db.collection('Items');

    const userCart = await cartCollection.findOne({ userId });
    const itemToRemove = userCart?.items.find((i) => i.productId === productId);

    if (itemToRemove) {
      await itemsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $inc: { stock: itemToRemove.quantity } }
      );
    }

    await cartCollection.updateOne({ userId }, { $pull: { items: { productId } } });
    const updatedCart = await cartCollection.findOne({ userId });
    res.json({ cart: updatedCart?.items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to remove item.' });
  }
});

// DELETE /api/cart - Clears all items from the cart
app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await client.db(MONGO_DB_NAME).collection('Cart').updateOne(
      { userId: req.user._id },
      { $set: { items: [] } },
      { upsert: true }
    );
    res.json({ cart: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to clear cart.' });
  }
});

//##### Products Routes #####

// GET /api/products - Returns all active products with full image URLs
app.get('/api/products', async (req, res) => {
  try {
    const products = await client.db(MONGO_DB_NAME).collection('Items').find({ active: true }).toArray();
    const base = `${req.protocol}://${req.headers.host}`;
    const productsWithFullUrl = products.map((p) => ({
      ...p,
      imageUrl: `${base}/images/${encodeURIComponent(path.basename(p.imageUrl || ''))}`,
    }));
    res.json(productsWithFullUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load products.' });
  }
});

// GET /api/products/:id - Returns a single product by ID with full image URL
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await client.db(MONGO_DB_NAME).collection('Items').findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const base = `${req.protocol}://${req.headers.host}`;
    product.imageUrl = `${base}/images/${encodeURIComponent(path.basename(product.imageUrl || ''))}`;
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Invalid product ID.' });
  }
});

// ##### Orders Routes #####

// POST /api/orders - Creates a new order and auto marks it Delivered after 1 minute
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items, total } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Order must include at least one item.' });
  if (typeof total !== 'number' || total <= 0) return res.status(400).json({ error: 'Total must be positive.' });

  try {
    const db = client.db(MONGO_DB_NAME);
    const ordersCollection = db.collection('orders');
    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date();

    await ordersCollection.insertOne({
      userId: req.user._id,
      orderId,
      status: 'Processing',
      total,
      items,
      createdAt,
    });

    // Clear the cart after order is placed
    await db.collection('Cart').updateOne(
      { userId: req.user._id },
      { $set: { items: [] } },
      { upsert: true }
    );

    // Auto mark order as Delivered after 1 minute
    setTimeout(async () => {
      try {
        await ordersCollection.updateOne({ orderId }, { $set: { status: 'Delivered' } });
        console.log(`Order ${orderId} marked Delivered`);
      } catch (err) {
        console.error('Auto-delivery update failed', err);
      }
    }, 60000);

    res.status(201).json({ orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to create order.' });
  }
});

// GET /api/orders - Returns all orders for the logged in user sorted by date
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await client.db(MONGO_DB_NAME)
      .collection('orders')
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch orders.' });
  }
});

//##### Start Server #####
async function start() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    app.listen(5000, '0.0.0.0', () => console.log('Server is running on port 5000'));
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

start();