export type Language = 'en' | 'ur';

export interface ProductSpec {
  keyEn: string;
  keyUr: string;
  value: string;
}

export interface Category {
  id: number;
  slug: string;
  nameEn: string;
  nameUr: string;
  imageUrl: string;
  iconKey: string;
  displayOrder: number;
}

export interface Product {
  id: number;
  slug: string;
  categoryId: number | null;
  nameEn: string;
  nameUr: string;
  brand: string;
  modelNumber: string;
  pricePkr: number;
  oldPricePkr: number | null;
  stockQty: number;
  rating: string;
  reviewsCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isLatest: boolean;
  isDemo: boolean;
  warrantyEn: string;
  warrantyUr: string;
  descriptionEn: string;
  descriptionUr: string;
  specs: ProductSpec[];
  images: string[];
  createdAt?: string;
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

export interface StoreSettings {
  id: number;
  storeNameEn: string;
  storeNameUr: string;
  logoUrl: string | null;
  phone: string;
  whatsappNumber: string;
  email: string;
  addressEn: string;
  addressUr: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  deliveryFeePkr: number;
  freeDeliveryThresholdPkr: number;
  bankDetailsEn: string;
  bankDetailsUr: string;
  heroTitleEn: string;
  heroTitleUr: string;
  heroSubtitleEn: string;
  heroSubtitleUr: string;
  heroImageUrl: string;
  offers: SpecialOffer[];
}

export interface Review {
  id: number;
  productId: number | null;
  authorName: string;
  authorCity: string;
  rating: number;
  commentEn: string;
  commentUr: string;
  isSample: boolean;
  isVerified: boolean;
  createdAt: string;
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

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: number;
  orderNumber: string;
  userUid: string | null;
  customerName: string;
  customerPhone: string;
  city: string;
  deliveryAddress: string;
  paymentMethod: 'cod' | 'bank_transfer';
  status: OrderStatus;
  subtotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'customer';
}
