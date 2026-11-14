import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface ProductSpec {
  keyEn: string;
  keyUr: string;
  value: string;
}

export interface OrderItem {
  productId: number;
  nameEn: string;
  nameUr: string;
  brand: string;
  modelNumber: string;
  pricePkr: number;
  quantity: number;
  image: string;
}

export interface SpecialOffer {
  id: string;
  categorySlug: string;
  titleEn: string;
  titleUr: string;
  subtitleEn: string;
  subtitleUr: string;
  discountLabelEn: string;
  discountLabelUr: string;
  imageUrl: string;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default(''),
  role: text('role').notNull().default('customer'), // 'admin' | 'customer'
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameUr: text('name_ur').notNull(),
  imageUrl: text('image_url').notNull(),
  iconKey: text('icon_key').notNull().default('monitor'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  nameEn: text('name_en').notNull(),
  nameUr: text('name_ur').notNull(),
  brand: text('brand').notNull(),
  modelNumber: text('model_number').notNull(),
  pricePkr: integer('price_pkr').notNull(),
  oldPricePkr: integer('old_price_pkr'),
  stockQty: integer('stock_qty').notNull().default(10),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('4.70'),
  reviewsCount: integer('reviews_count').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(false),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isLatest: boolean('is_latest').notNull().default(false),
  isDemo: boolean('is_demo').notNull().default(true),
  warrantyEn: text('warranty_en').notNull().default('1 Year Official Warranty'),
  warrantyUr: text('warranty_ur').notNull().default('1 سال آفیشل وارنٹی'),
  descriptionEn: text('description_en').notNull(),
  descriptionUr: text('description_ur').notNull(),
  specs: jsonb('specs').$type<ProductSpec[]>().notNull().default([]),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userUid: text('user_uid'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  city: text('city').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  paymentMethod: text('payment_method').notNull().default('cod'), // 'cod' | 'bank_transfer'
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
  subtotalPkr: integer('subtotal_pkr').notNull(),
  deliveryFeePkr: integer('delivery_fee_pkr').notNull().default(0),
  totalPkr: integer('total_pkr').notNull(),
  notes: text('notes').default(''),
  items: jsonb('items').$type<OrderItem[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorCity: text('author_city').notNull().default('Lahore'),
  rating: integer('rating').notNull().default(5),
  commentEn: text('comment_en').notNull(),
  commentUr: text('comment_ur').notNull(),
  isSample: boolean('is_sample').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey(),
  storeNameEn: text('store_name_en').notNull(),
  storeNameUr: text('store_name_ur').notNull(),
  logoUrl: text('logo_url').default(''),
  phone: text('phone').notNull(),
  whatsappNumber: text('whatsapp_number').notNull(),
  email: text('email').notNull(),
  addressEn: text('address_en').notNull(),
  addressUr: text('address_ur').notNull(),
  facebookUrl: text('facebook_url').default(''),
  instagramUrl: text('instagram_url').default(''),
  youtubeUrl: text('youtube_url').default(''),
  deliveryFeePkr: integer('delivery_fee_pkr').notNull().default(500),
  freeDeliveryThresholdPkr: integer('free_delivery_threshold_pkr').notNull().default(25000),
  bankDetailsEn: text('bank_details_en').notNull(),
  bankDetailsUr: text('bank_details_ur').notNull(),
  heroTitleEn: text('hero_title_en').notNull(),
  heroTitleUr: text('hero_title_ur').notNull(),
  heroSubtitleEn: text('hero_subtitle_en').notNull(),
  heroSubtitleUr: text('hero_subtitle_ur').notNull(),
  heroImageUrl: text('hero_image_url').notNull(),
  offers: jsonb('offers').$type<SpecialOffer[]>().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const uploadedAssets = pgTable('uploaded_assets', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));
