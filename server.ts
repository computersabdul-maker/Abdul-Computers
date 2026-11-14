import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { and, asc, desc, eq, gte, gt, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  categories,
  orders,
  products,
  reviews,
  storeSettings,
  uploadedAssets,
  OrderItem,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import { AuthRequest, optionalAuth, requireAdmin, requireAuth } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Serve generated product & hero images reliably in both dev and production
app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

// Serve uploaded assets stored in PostgreSQL
app.get('/api/assets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send('Invalid asset ID');
    }
    const [asset] = await db
      .select()
      .from(uploadedAssets)
      .where(eq(uploadedAssets.id, id))
      .limit(1);

    if (!asset) {
      return res.status(404).send('Asset not found');
    }
    const buffer = Buffer.from(asset.dataBase64, 'base64');
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to serve asset:', error);
    res.status(500).send('Error serving asset');
  }
});

// Bootstrap endpoint for homepage and initial store state
app.get('/api/bootstrap', async (_req, res) => {
  try {
    await ensureSeeded();
    const [allSettings, allCategories, allProducts, allReviews] = await Promise.all([
      db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1),
      db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.id)),
      db.select().from(products).orderBy(desc(products.id)),
      db.select().from(reviews).orderBy(desc(reviews.createdAt)),
    ]);

    res.json({
      settings: allSettings[0] || null,
      categories: allCategories,
      products: allProducts,
      reviews: allReviews,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Unable to load store catalog right now.' });
  }
});

// Filtered product catalog endpoint
app.get('/api/products', async (req, res) => {
  try {
    await ensureSeeded();
    const {
      q = '',
      category = '',
      brand = '',
      minPrice,
      maxPrice,
      inStock,
      sort = 'newest',
    } = req.query as Record<string, string | undefined>;

    const conditions = [];

    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(products.nameEn, pattern),
          ilike(products.nameUr, pattern),
          ilike(products.brand, pattern),
          ilike(products.modelNumber, pattern),
          ilike(products.descriptionEn, pattern)
        )
      );
    }

    if (category && category !== 'all') {
      const [cat] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);
      if (cat) {
        conditions.push(eq(products.categoryId, cat.id));
      } else {
        return res.json([]);
      }
    }

    if (brand && brand !== 'all') {
      conditions.push(ilike(products.brand, brand));
    }

    if (minPrice && !Number.isNaN(Number(minPrice))) {
      conditions.push(gte(products.pricePkr, Number(minPrice)));
    }
    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      conditions.push(lte(products.pricePkr, Number(maxPrice)));
    }
    if (inStock === 'true') {
      conditions.push(gt(products.stockQty, 0));
    }

    let orderClause = desc(products.createdAt);
    if (sort === 'price_asc') orderClause = asc(products.pricePkr);
    else if (sort === 'price_desc') orderClause = desc(products.pricePkr);
    else if (sort === 'popular') orderClause = desc(products.reviewsCount);

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(products)
            .where(and(...conditions))
            .orderBy(orderClause, desc(products.id))
        : await db.select().from(products).orderBy(orderClause, desc(products.id));

    res.json(rows);
  } catch (error) {
    console.error('Products query failed:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Single product detail + related products + reviews
app.get('/api/products/:slug', async (req, res) => {
  try {
    await ensureSeeded();
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, req.params.slug))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [related, prodReviews] = await Promise.all([
      product.categoryId
        ? db
            .select()
            .from(products)
            .where(
              and(
                eq(products.categoryId, product.categoryId),
                sql`${products.id} != ${product.id}`
              )
            )
            .limit(4)
        : Promise.resolve([]),
      db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, product.id))
        .orderBy(desc(reviews.createdAt)),
    ]);

    res.json({ product, related, reviews: prodReviews });
  } catch (error) {
    console.error('Product detail failed:', error);
    res.status(500).json({ error: 'Failed to load product details' });
  }
});

// Current authenticated user + role
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ user: req.dbUser });
});

// Place customer order (authoritative server-side price & delivery calculation)
app.post('/api/orders', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const { customerName, customerPhone, city, deliveryAddress, paymentMethod, notes, items } =
      req.body as {
        customerName?: string;
        customerPhone?: string;
        city?: string;
        deliveryAddress?: string;
        paymentMethod?: string;
        notes?: string;
        items?: Array<{ productId: number; quantity: number }>;
      };

    if (!customerName?.trim() || !customerPhone?.trim() || !city?.trim() || !deliveryAddress?.trim()) {
      return res.status(400).json({ error: 'Customer name, phone, city, and delivery address are required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' });
    }

    const productIds = items.map((i) => Number(i.productId)).filter((id) => Number.isInteger(id) && id > 0);
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items.' });
    }

    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const orderItems: OrderItem[] = [];
    let subtotalPkr = 0;

    for (const reqItem of items) {
      const prod = productMap.get(Number(reqItem.productId));
      const qty = Math.max(1, Math.min(99, Math.floor(Number(reqItem.quantity) || 1)));
      if (!prod) {
        return res.status(400).json({ error: `Product #${reqItem.productId} is no longer available.` });
      }
      subtotalPkr += prod.pricePkr * qty;
      orderItems.push({
        productId: prod.id,
        nameEn: prod.nameEn,
        nameUr: prod.nameUr,
        brand: prod.brand,
        modelNumber: prod.modelNumber,
        pricePkr: prod.pricePkr,
        quantity: qty,
        image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : '',
      });
    }

    const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    const baseDeliveryFee = settings?.deliveryFeePkr ?? 500;
    const freeThreshold = settings?.freeDeliveryThresholdPkr ?? 30000;
    const deliveryFeePkr = subtotalPkr >= freeThreshold ? 0 : baseDeliveryFee;
    const totalPkr = subtotalPkr + deliveryFeePkr;

    const orderNumber = `MC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const validPayment = paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cod';

    const [created] = await db
      .insert(orders)
      .values({
        orderNumber,
        userUid: req.user?.uid || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        city: city.trim(),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: validPayment,
        status: 'Pending',
        subtotalPkr,
        deliveryFeePkr,
        totalPkr,
        notes: (notes || '').trim(),
        items: orderItems,
      })
      .returning();

    // Decrement stock safely without going below zero
    for (const item of orderItems) {
      const prod = productMap.get(item.productId);
      if (prod) {
        await db
          .update(products)
          .set({ stockQty: Math.max(0, prod.stockQty - item.quantity) })
          .where(eq(products.id, prod.id));
      }
    }

    res.status(201).json({ order: created });
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Unable to place order. Please try again.' });
  }
});

// Guest order status lookup by order number + phone
app.get('/api/orders/lookup', async (req, res) => {
  try {
    const orderNumber = String(req.query.orderNumber || '').trim();
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (!orderNumber || phone.length < 4) {
      return res.status(400).json({ error: 'Order number and phone digits are required.' });
    }
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const storedDigits = order.customerPhone.replace(/\D/g, '');
    if (!storedDigits.endsWith(phone.slice(-4))) {
      return res.status(403).json({ error: 'Phone number does not match this order.' });
    }
    res.json({ order });
  } catch (error) {
    console.error('Order lookup failed:', error);
    res.status(500).json({ error: 'Failed to look up order.' });
  }
});

// Signed-in customer order history
app.get('/api/orders/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    const myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, req.user!.uid))
      .orderBy(desc(orders.createdAt));
    res.json({ orders: myOrders });
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
});

// Submit a customer review (real review, clearly distinguished from sample reviews)
app.post('/api/reviews', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { productId, authorName, authorCity, rating, commentEn, commentUr } = req.body as {
      productId?: number | null;
      authorName?: string;
      authorCity?: string;
      rating?: number;
      commentEn?: string;
      commentUr?: string;
    };

    if (!authorName?.trim() || (!commentEn?.trim() && !commentUr?.trim())) {
      return res.status(400).json({ error: 'Name and review comment are required.' });
    }

    const safeRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const [created] = await db
      .insert(reviews)
      .values({
        productId: productId || null,
        authorName: authorName.trim(),
        authorCity: (authorCity || 'Pakistan').trim(),
        rating: safeRating,
        commentEn: (commentEn || commentUr || '').trim(),
        commentUr: (commentUr || commentEn || '').trim(),
        isSample: false,
        isVerified: Boolean(req.user),
      })
      .returning();

    res.status(201).json({ review: created });
  } catch (error) {
    console.error('Review submission failed:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// ==================== ADMIN ROUTES ====================

// Upload image asset (stored persistently in PostgreSQL)
app.post('/api/admin/upload', requireAdmin, async (req, res) => {
  try {
    const { filename, mimeType, dataBase64 } = req.body as {
      filename?: string;
      mimeType?: string;
      dataBase64?: string;
    };

    if (!dataBase64 || !mimeType || !mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Valid image file is required.' });
    }
    // Strip data URI prefix if present
    const cleanBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
    if (cleanBase64.length > 7_000_000) {
      return res.status(400).json({ error: 'Image must be under 5MB.' });
    }

    const [asset] = await db
      .insert(uploadedAssets)
      .values({
        filename: filename || 'upload.jpg',
        mimeType,
        dataBase64: cleanBase64,
      })
      .returning({ id: uploadedAssets.id });

    res.status(201).json({ url: `/api/assets/${asset.id}` });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

// Admin: Create Product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const baseSlug = (body.slug || body.nameEn || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const [created] = await db
      .insert(products)
      .values({
        slug,
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        nameEn: String(body.nameEn || '').trim(),
        nameUr: String(body.nameUr || body.nameEn || '').trim(),
        brand: String(body.brand || 'HP').trim(),
        modelNumber: String(body.modelNumber || 'STD-001').trim(),
        pricePkr: Math.max(0, Number(body.pricePkr) || 0),
        oldPricePkr: body.oldPricePkr ? Number(body.oldPricePkr) : null,
        stockQty: Math.max(0, Number(body.stockQty) || 0),
        rating: String(body.rating || '4.80'),
        reviewsCount: Number(body.reviewsCount) || 0,
        isFeatured: Boolean(body.isFeatured),
        isBestSeller: Boolean(body.isBestSeller),
        isLatest: Boolean(body.isLatest ?? true),
        isDemo: false,
        warrantyEn: String(body.warrantyEn || '1 Year Official Warranty'),
        warrantyUr: String(body.warrantyUr || '1 سال آفیشل وارنٹی'),
        descriptionEn: String(body.descriptionEn || ''),
        descriptionUr: String(body.descriptionUr || body.descriptionEn || ''),
        specs: Array.isArray(body.specs) ? body.specs : [],
        images: Array.isArray(body.images) ? body.images : [],
      })
      .returning();

    res.status(201).json({ product: created });
  } catch (error) {
    console.error('Admin create product failed:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Admin: Update Product
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const [updated] = await db
      .update(products)
      .set({
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        nameEn: String(body.nameEn || '').trim(),
        nameUr: String(body.nameUr || '').trim(),
        brand: String(body.brand || '').trim(),
        modelNumber: String(body.modelNumber || '').trim(),
        pricePkr: Math.max(0, Number(body.pricePkr) || 0),
        oldPricePkr: body.oldPricePkr ? Number(body.oldPricePkr) : null,
        stockQty: Math.max(0, Number(body.stockQty) || 0),
        isFeatured: Boolean(body.isFeatured),
        isBestSeller: Boolean(body.isBestSeller),
        isLatest: Boolean(body.isLatest),
        isDemo: Boolean(body.isDemo),
        warrantyEn: String(body.warrantyEn || ''),
        warrantyUr: String(body.warrantyUr || ''),
        descriptionEn: String(body.descriptionEn || ''),
        descriptionUr: String(body.descriptionUr || ''),
        specs: Array.isArray(body.specs) ? body.specs : [],
        images: Array.isArray(body.images) ? body.images : [],
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: updated });
  } catch (error) {
    console.error('Admin update product failed:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Admin: Delete Product
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Admin delete product failed:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Admin: Create Category
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const slug = (body.slug || body.nameEn || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-3)}`;

    const [created] = await db
      .insert(categories)
      .values({
        slug,
        nameEn: String(body.nameEn || '').trim(),
        nameUr: String(body.nameUr || '').trim(),
        imageUrl: String(body.imageUrl || '/src/assets/images/prod_desktop_monitor_1794665755780.jpg'),
        iconKey: String(body.iconKey || 'monitor'),
        displayOrder: Number(body.displayOrder) || 99,
      })
      .returning();

    res.status(201).json({ category: created });
  } catch (error) {
    console.error('Admin create category failed:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Admin: Update Category
app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const [updated] = await db
      .update(categories)
      .set({
        nameEn: String(body.nameEn || '').trim(),
        nameUr: String(body.nameUr || '').trim(),
        imageUrl: String(body.imageUrl || ''),
        iconKey: String(body.iconKey || 'monitor'),
        displayOrder: Number(body.displayOrder) || 0,
      })
      .where(eq(categories.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: updated });
  } catch (error) {
    console.error('Admin update category failed:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// Admin: Delete Category
app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Admin delete category failed:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// Admin: List All Orders
app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  try {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.json({ orders: allOrders });
  } catch (error) {
    console.error('Admin fetch orders failed:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Admin: Update Order Status
app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status?: string };
    const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order: updated });
  } catch (error) {
    console.error('Admin update order status failed:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// Admin: Update Website Settings
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const [updated] = await db
      .update(storeSettings)
      .set({
        storeNameEn: String(b.storeNameEn || 'Mamoo Computers'),
        storeNameUr: String(b.storeNameUr || 'ماموں کمپیوٹرز'),
        logoUrl: String(b.logoUrl || ''),
        phone: String(b.phone || ''),
        whatsappNumber: String(b.whatsappNumber || ''),
        email: String(b.email || ''),
        addressEn: String(b.addressEn || ''),
        addressUr: String(b.addressUr || ''),
        facebookUrl: String(b.facebookUrl || ''),
        instagramUrl: String(b.instagramUrl || ''),
        youtubeUrl: String(b.youtubeUrl || ''),
        deliveryFeePkr: Math.max(0, Number(b.deliveryFeePkr) || 0),
        freeDeliveryThresholdPkr: Math.max(0, Number(b.freeDeliveryThresholdPkr) || 0),
        bankDetailsEn: String(b.bankDetailsEn || ''),
        bankDetailsUr: String(b.bankDetailsUr || ''),
        heroTitleEn: String(b.heroTitleEn || ''),
        heroTitleUr: String(b.heroTitleUr || ''),
        heroSubtitleEn: String(b.heroSubtitleEn || ''),
        heroSubtitleUr: String(b.heroSubtitleUr || ''),
        heroImageUrl: String(b.heroImageUrl || ''),
        offers: Array.isArray(b.offers) ? b.offers : [],
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.id, 1))
      .returning();
    res.json({ settings: updated });
  } catch (error) {
    console.error('Admin update settings failed:', error);
    res.status(500).json({ error: 'Failed to update store settings.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mamoo Computers server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
