require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
// CORS: allow frontend origin(s) - support multiple origins separated by comma
// If FRONTEND_URL is not set, allow all origins (useful for development and separate deployments)
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || '';
const allowedOrigins = FRONTEND_URL 
  ? FRONTEND_URL.split(',').map(url => url.trim()).filter(url => url)
  : [];

const corsOptions = allowedOrigins.length > 0
  ? {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) or if origin is in allowed list
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200
    }
  : {
      // Allow all origins if FRONTEND_URL is not set
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for debugging in Vercel logs
app.use((req, res, next) => {
  console.log(`[Req] ${req.method} ${req.url}`);
  next();
});

// ----- Mongo Connection -----
const mongoUri = process.env.MONGODB_URI;
let mongoConnecting = null;
async function ensureDb() {
  if (!mongoUri) {
    console.warn('[WARN] MONGODB_URI not set.');
    return;
  }
  if (mongoose.connection.readyState === 1) return; // connected
  if (!mongoConnecting) {
    mongoConnecting = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 15000 })
      .then(async () => {
        console.log('[DB] Connected to MongoDB');
        try { await seedProducts(); } catch (e) { console.error('[DB] Seed failed:', e); }
      })
      .catch((err) => {
        console.error('[DB] Connection error:', err.message);
        mongoConnecting = null;
      });
  }
  return mongoConnecting;
}

// ----- Schemas & Models -----
const OrderSchema = new mongoose.Schema({
  productId: Number,
  productName: String,
  size: String,
  color: String,
  quantity: Number,
  price: Number,
  total: Number,
  employeeCode: String,
  name: String,
  email: String,
  phone: String,
}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const ProductVariantSchema = new mongoose.Schema({
  size: String,
  color: String,
  stock: { type: Number, default: 0 },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  productId: { type: Number, unique: true },
  name: String,
  price: Number,
  image: String,
  variants: [ProductVariantSchema],
}, { timestamps: true });

const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ----- Mail Transport -----
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
const ORDER_NOTIFY_TO = process.env.ORDER_NOTIFY_TO || process.env.MAIL_TO || 'orders@yourcompany.com';

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  console.log('[Mail] Transport configured:', { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE });
} else {
  console.warn('[WARN] Mail transport not configured.');
}

// ----- Seed Products -----
async function seedProducts() {
  if (mongoose.connection.readyState !== 1) return;
  const count = await ProductModel.estimatedDocumentCount();
  if (count > 0) return;
  const seed = [
    { productId: 1, name: 'Women Printed Kurta', price: 1299, image: 'images/shopping (1).webp', variants: [
      { size: 'S', color: 'White', stock: 10 }, { size: 'M', color: 'White', stock: 15 }, { size: 'L', color: 'White', stock: 8 }, { size: 'XL', color: 'White', stock: 5 }
    ]},
    { productId: 2, name: 'Men Solid Polo T-Shirt', price: 2499, image: 'images/shopping (2).webp', variants: [
      { size: '30', color: 'Blue', stock: 5 }, { size: '32', color: 'Blue', stock: 8 }, { size: '34', color: 'Blue', stock: 3 }, { size: '30', color: 'Black', stock: 7 }, { size: '32', color: 'Black', stock: 4 }
    ]},
    { productId: 3, name: 'Women Wide-Leg Trousers', price: 4999, image: 'images/shopping (3).webp', variants: [
      { size: 'M', color: 'Navy', stock: 4 }, { size: 'L', color: 'Navy', stock: 6 }, { size: 'XL', color: 'Navy', stock: 3 }, { size: 'M', color: 'Charcoal', stock: 2 }, { size: 'L', color: 'Charcoal', stock: 5 }
    ]},
    { productId: 4, name: 'Men White Casual Blazer', price: 3299, image: 'images/shopping.webp', variants: [
      { size: 'XS', color: 'Multi', stock: 7 }, { size: 'S', color: 'Multi', stock: 5 }, { size: 'M', color: 'Multi', stock: 3 }, { size: 'L', color: 'Multi', stock: 4 }
    ]},
  ];
  await ProductModel.insertMany(seed);
  console.log('[DB] Seeded products collection with', seed.length, 'items');
}

// ----- Routes -----
app.get('/api/health', async (req, res) => {
  await ensureDb();
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', mail: !!transporter });
});

app.get('/api/products', async (req, res) => {
  try {
    await ensureDb();
    if (mongoose.connection.readyState !== 1) {
      console.warn('[API] /api/products - DB not connected');
      return res.status(500).json({ ok: false, error: 'Database not connected' });
    }
    const docs = await ProductModel.find({}).lean();
    const products = docs.map((d) => ({ id: d.productId, name: d.name, price: d.price, image: d.image, variants: d.variants }));
    res.json({ ok: true, products });
  } catch (e) {
    console.error('[API] /api/products error:', e);
    res.status(500).json({ ok: false, error: 'Failed to load products' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    await ensureDb();
    if (mongoose.connection.readyState !== 1) {
      console.warn('[API] /api/orders - DB not connected');
      return res.status(500).json({ ok: false, error: 'Database not connected' });
    }
    const { productId, productName, size, color, quantity, employeeCode, name, email, phone } = req.body;
    const qty = Number(quantity);

    const updated = await ProductModel.findOneAndUpdate(
      { productId, 'variants.size': size, 'variants.color': color, 'variants.stock': { $gte: qty } },
      { $inc: { 'variants.$.stock': -qty } },
      { new: true }
    ).lean();

    if (!updated) return res.status(400).json({ ok: false, error: 'Insufficient stock' });
    const variant = updated.variants.find(v => v.size === size && v.color === color);
    const dbPrice = Number(updated.price);
    const total = dbPrice * qty;

    const saved = await OrderModel.create({
      productId,
      productName: updated.name,
      size,
      color,
      quantity: qty,
      price: dbPrice,
      total,
      employeeCode,
      name,
      email,
      phone,
    });

    // email
    let emailInfo = null;
    if (transporter) {
      const to = ORDER_NOTIFY_TO;
      const subject = `New Order - ${updated.name}`;
      const text = `Order Details\n\n` +
        `Product: ${updated.name}\n` +
        `Size: ${size}\n` +
        `Color: ${color}\n` +
        `Quantity: ${qty}\n` +
        `Price: ₹${Number(dbPrice).toLocaleString('en-IN')}\n` +
        `Total: ₹${Number(total).toLocaleString('en-IN')}\n\n` +
        `Employee Information\n` +
        `Employee Code: ${employeeCode}\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}`;
      const html = `
        <h2>New Order</h2>
        <p><b>Product:</b> ${updated.name}</p>
        <p><b>Size:</b> ${size}</p>
        <p><b>Color:</b> ${color}</p>
        <p><b>Quantity:</b> ${qty}</p>
        <p><b>Price:</b> ₹${Number(dbPrice).toLocaleString('en-IN')}</p>
        <p><b>Total:</b> ₹${Number(total).toLocaleString('en-IN')}</p>
        <hr />
        <h3>Employee Information</h3>
        <p><b>Employee Code:</b> ${employeeCode}</p>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
      `;
      try {
        emailInfo = await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text, html });
      } catch (err) {
        console.error('[Mail] Send failed:', err);
      }
    }

    res.status(201).json({ ok: true, id: saved._id, emailSent: !!emailInfo, productId, newStock: variant ? variant.stock : undefined });
  } catch (err) {
    console.error('[API] /api/orders error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create order' });
  }
});

// Global error handler (safer for serverless logs)
app.use((err, req, res, next) => {
  console.error('[ERR] Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
});

module.exports = app;
