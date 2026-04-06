const dns = require('dns');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

// Force Node to use reliable DNS servers for SRV lookups (avoids local DNS issues)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

app.use(express.json());
app.use(cors());

const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'mummycome12';
const MONGO_URI = process.env.MONGO_URI ||
  `mongodb+srv://Estore:${MONGO_PASSWORD}@cluster0.ys7mw.mongodb.net/?retryWrites=true&w=majority`;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'Estore';

const client = new MongoClient(MONGO_URI);

function isValidEmail(email) {
  // Basic email format check; this is not exhaustive but sufficient for client/server validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(userId) {
  // Simple token: base64-encode the user ID. 
  return Buffer.from(userId.toString()).toString('base64');
}

function verifyToken(token) {
  try {
    return Buffer.from(token, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

async function getUserFromToken(token) {
  const userId = verifyToken(token);
  if (!userId) return null;
  if (!ObjectId.isValid(userId)) return null;
  const user = await client
    .db(MONGO_DB_NAME)
    .collection('users')
    .findOne({ _id: new ObjectId(userId) });
  return user;
}

function authMiddleware(req, res, next) {
  const authHeader = (req.headers.authorization || '').trim();
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

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

// Route to get current user info (for frontend to check if logged in and get user details)
app.get('/api/me', authMiddleware, (req, res) => {
    const { _id, first_name, last_name, email, phone, cart } = req.user;
  res.json({ id: _id, first_name, last_name, email, phone, cart: cart || [] });
});

// Users
app.post('/api/users', async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  // Basic required field checks
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Please fill out all required fields.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const collection = client.db(MONGO_DB_NAME).collection('users');

    const existingUser = await collection.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const result = await collection.insertOne({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim() || '',
      cart: [],
      createdAt: new Date(),
    });

    const token = createToken(result.insertedId);

    return res.status(201).json({ id: result.insertedId, token });
  } catch (error) {
    console.error('Error creating user', error);
    return res.status(500).json({ error: 'Unable to create user' });
  }
});
// Auth
app.post('/api/login', async (req, res) => {
  console.log("🔥 LOGIN ROUTE IS LOADED");
  const { email, password } = req.body;
  console.log('Login attempt', { email });
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await client
      .db(MONGO_DB_NAME)
      .collection('users')
      .findOne({ email: email.toLowerCase().trim() });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Unable to log in' });
  }
});
// Cart
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const collection = client.db(MONGO_DB_NAME).collection('Cart');

    // Find the cart where the userId matches the logged-in user
    const userCart = await collection.findOne({ userId: req.user._id });

    // If no cart exists yet for this user, return an empty array
    if (!userCart) {
      return res.json({ cart: [] });
    }

    // Return the items array from the cart document
    res.json({ cart: userCart.items || [] });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Unable to fetch cart items' });
  }
});
app.post('/api/cart', authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body; // 'quantity' here is the NEW total quantity
  const userId = req.user._id;

  if (!productId || typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Valid productId and quantity are required.' });
  }

  try {
    const db = client.db(MONGO_DB_NAME);
    const itemsCollection = db.collection('Items');
    const cartCollection = db.collection('Cart');

    // 1. Get the current product and current cart state
    const product = await itemsCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let userCart = await cartCollection.findOne({ userId: userId });
    if (!userCart) userCart = { userId: userId, items: [] };

    const items = userCart.items || [];
    const existingItem = items.find((item) => item.productId === productId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    // 2. Calculate the difference (How many more/less do we need from stock?)
    // If I had 1 and I want 3, diff is 2 (subtract 2 from stock)
    // If I had 3 and I want 1, diff is -2 (add 2 back to stock)
    const diff = quantity - currentQtyInCart;

    // 3. Check if there is enough stock if we are increasing quantity
    if (diff > 0 && product.stock < diff) {
      return res.status(400).json({ error: `Not enough stock. Only ${product.stock} left.` });
    }

    // 4. Update the Product Stock in "Items" collection
    // $inc with a negative number decreases the value
    await itemsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $inc: { stock: -diff } }
    );

    // 5. Update the Cart collection
    if (existingItem) {
      const existingIndex = items.findIndex((item) => item.productId === productId);
      items[existingIndex].quantity = quantity;
    } else {
      items.push({ productId, quantity });
    }

    await cartCollection.updateOne(
      { userId: userId },
      { $set: { items: items } },
      { upsert: true }
    );

    return res.json({ cart: items });
  } catch (error) {
    console.error('Error updating cart & stock:', error);
    return res.status(500).json({ error: 'Unable to update cart' });
  }
});
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = client.db(MONGO_DB_NAME).collection('Items');
    
    // We use ObjectId to search the database by the unique ID
    const product = await collection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching single product:', error);
    res.status(500).json({ error: 'Invalid product ID' });
  }
});

app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const db = client.db(MONGO_DB_NAME);
    const cartCollection = db.collection('Cart');
    const itemsCollection = db.collection('Items');

    // 1. Find the item in the cart to see how many were there
    const userCart = await cartCollection.findOne({ userId: userId });
    const itemToRemove = userCart?.items.find(i => i.productId === productId);

    if (itemToRemove) {
      // 2. Return the quantity back to the Items stock
      await itemsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $inc: { stock: itemToRemove.quantity } }
      );
    }

    // 3. Remove from cart
    await cartCollection.updateOne(
      { userId: userId },
      { $pull: { items: { productId: productId } } }
    );

    const updatedCart = await cartCollection.findOne({ userId: userId });
    return res.json({ cart: updatedCart ? updatedCart.items : [] });
  } catch (error) {
    console.error('Error removing item & restoring stock:', error);
    return res.status(500).json({ error: 'Unable to remove item' });
  }
});
// Orders
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items, total } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ error: 'Total must be a positive number' });
  }

  try {
    const ordersCollection = client.db(MONGO_DB_NAME).collection('orders');
    const orderId = `ORD-${Date.now()}`;
    const newOrder = {
      userId: req.user._id,
      orderId,
      status: 'Processing',
      total,
      items,
      createdAt: new Date(),
    };

    await ordersCollection.insertOne(newOrder);

    // Clear cart after order
    await client.db(MONGO_DB_NAME).collection('Cart').updateOne(
      { userId: req.user._id },
      { $set: { items: [] } },
    );

    return res.status(201).json({ orderId });
  } catch (error) {
    console.error('Error creating order', error);
    return res.status(500).json({ error: 'Unable to create order' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const ordersCollection = client.db(MONGO_DB_NAME).collection('orders');
    const orders = await ordersCollection
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders', error);
    return res.status(500).json({ error: 'Unable to fetch orders' });
  }
});

// Products (serving the same data used by frontend)
app.get('/api/products', async (req, res) => {
  try {
    // 1. Access the collection
    const collection = client.db(MONGO_DB_NAME).collection('Items');

    // 2. Query only for items where active is exactly true
    // This happens at the database level (very fast)
    const products = await collection
      .find({ active: true }) 
      .toArray();

    // 3. Send the filtered list to the frontend
    res.json(products);
  } catch (error) {
    console.error('Error loading products from DB:', error);
    res.status(500).json({ error: 'Unable to load products' });
  }
});
async function start() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    app.listen(5000, '0.0.0.0', () => {
      console.log('Server is running on port 5000');
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

start();
