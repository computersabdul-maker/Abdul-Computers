import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { buildWhatsAppUrl, formatPkr, t } from '../i18n/translations.ts';
import { Product, Review } from '../types/store.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { AppView } from '../components/Header.tsx';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

export function ProductDetailPage({ slug, onNavigate }: ProductDetailPageProps) {
  const { lang, settings, addToCart, setCartOpen, wishlist, toggleWishlist } = useStore();
  const copy = t[lang];
  const BackIcon = lang === 'ur' ? ArrowRight : ArrowLeft;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setActiveImageIdx(0);
    setQty(1);

    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
        setProductReviews(data.reviews || []);
        document.title = `${data.product.nameEn} | Mamoo Computers`;
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load product');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-base text-slate-700">{error || 'Product not found'}</p>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'catalog' })}
          className="mt-4 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copy.backToCatalog}
        </button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];
  const activeImage = images[activeImageIdx] || images[0];
  const isWishlisted = wishlist.includes(product.id);
  const title = lang === 'ur' ? product.nameUr : product.nameEn;
  const secondaryTitle = lang === 'ur' ? product.nameEn : product.nameUr;

  const discountPct =
    product.oldPricePkr && product.oldPricePkr > product.pricePkr
      ? Math.round(((product.oldPricePkr - product.pricePkr) / product.oldPricePkr) * 100)
      : 0;

  const whatsappHref = buildWhatsAppUrl(
    settings?.whatsappNumber || '923004128950',
    lang === 'ur'
      ? `السلام علیکم ماموں کمپیوٹرز، مجھے ${product.nameEn} (${product.modelNumber}) خریدنا/معلومات درکار ہیں، قیمت: ${formatPkr(product.pricePkr)}`
      : `Assalam-o-Alaikum Mamoo Computers, I want to inquire about ${product.nameEn} (Model: ${product.modelNumber}) - ${formatPkr(product.pricePkr)}.`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-14">
      <button
        type="button"
        onClick={() => onNavigate({ name: 'catalog' })}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-[#1D4ED8]"
      >
        <BackIcon className="w-4 h-4" />
        <span>{copy.backToCatalog}</span>
      </button>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left: Sticky Multi-Image Gallery with Interactive Zoom */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
          <div
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white cursor-zoom-in"
          >
            <div
              className="w-full h-full transition-transform duration-150"
              style={
                zoomed
                  ? { transform: 'scale(1.65)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
            >
              <SafeImage
                src={activeImage}
                alt={title}
                fallbackLabel={product.brand}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pointer-events-none absolute bottom-3 end-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs text-slate-700 shadow-sm flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'زوم کریں' : 'Hover to zoom'}</span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    idx === activeImageIdx ? 'border-[#1D4ED8]' : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase Info & Controls */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span dir="ltr" className="font-bold text-[#1D4ED8] uppercase tracking-wider">
                {product.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="font-mono tabular-nums">
                {product.modelNumber}
              </span>
              {product.isDemo && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400">{copy.demoTag}</span>
                </>
              )}
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{secondaryTitle}</p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-700">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span dir="ltr" className="font-mono tabular-nums font-semibold">
                  {Number(product.rating).toFixed(1)} ({product.reviewsCount})
                </span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-semibold ${
                  product.stockQty > 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {product.stockQty > 0 ? (
                  <PackageCheck className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {product.stockQty > 0
                    ? `${copy.inStock} (${product.stockQty})`
                    : copy.outOfStock}
                </span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-baseline gap-3">
              <span dir="ltr" className="text-3xl font-extrabold text-[#0B1F3A] font-mono tabular-nums">
                {formatPkr(product.pricePkr)}
              </span>
              {product.oldPricePkr && product.oldPricePkr > product.pricePkr && (
                <>
                  <span dir="ltr" className="text-base text-slate-400 line-through font-mono tabular-nums">
                    {formatPkr(product.oldPricePkr)}
                  </span>
                  <span
                    dir="ltr"
                    className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700 font-mono tabular-nums"
                  >
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quantity & Action Buttons */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-slate-700 hover:bg-slate-200/70"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span dir="ltr" className="px-4 text-sm font-bold font-mono tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(1, product.stockQty), q + 1))}
                  className="p-2.5 text-slate-700 hover:bg-slate-200/70"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stockQty <= 0}
                onClick={() => {
                  addToCart(product, qty);
                  setCartOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B1F3A] disabled:bg-slate-300 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{copy.addToCart}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isWishlisted ? copy.wishlistRemove : copy.wishlistAdd}
                className="p-3 rounded-lg border border-slate-300 text-slate-700 hover:border-rose-500 hover:text-rose-600 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={product.stockQty <= 0}
                onClick={() => {
                  addToCart(product, qty);
                  onNavigate({ name: 'checkout' });
                }}
                className="w-full rounded-lg bg-[#0B1F3A] py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
              >
                {copy.buyNow}
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50/40 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{copy.whatsappInquiry}</span>
              </a>
            </div>
          </div>

          {/* Warranty Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wide">
                {copy.warrantyTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {lang === 'ur' ? product.warrantyUr : product.warrantyEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0B1F3A]">{copy.descriptionTitle}</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{product.descriptionEn}</p>
          <p dir="rtl" className="text-sm text-slate-700 leading-loose pt-3 border-t border-slate-100">
            {product.descriptionUr}
          </p>
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-[#0B1F3A] mb-4">{copy.specsTitle}</h2>
          {product.specs && product.specs.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {product.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 px-4 py-3 text-sm odd:bg-slate-50/70 even:bg-white"
                >
                  <span className="col-span-5 font-medium text-slate-600">
                    {lang === 'ur' ? spec.keyUr : spec.keyEn}
                  </span>
                  <span dir="ltr" className="col-span-7 font-mono text-xs sm:text-sm text-slate-900 text-end">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {lang === 'ur' ? 'مکمل تفصیلات جلد شامل کی جائیں گی۔' : 'Standard factory specifications apply.'}
            </p>
          )}
        </div>
      </div>

      {/* Product Reviews if any */}
      {productReviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0B1F3A]">{copy.reviewsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productReviews.map((rev) => (
              <div key={rev.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#0B1F3A]">{rev.authorName}</span>
                  <span className="text-xs text-slate-500">{rev.authorCity}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {lang === 'ur' ? rev.commentUr : rev.commentEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-[#0B1F3A]">{copy.relatedTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onOpenProduct={(s) => onNavigate({ name: 'product', slug: s })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
