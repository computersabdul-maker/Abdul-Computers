import { useState } from 'react';
import { Check, Heart, MessageCircle, ShoppingCart, Star, PackageCheck, AlertTriangle } from 'lucide-react';
import { Product } from '../types/store.ts';
import { useStore } from '../context/StoreContext.tsx';
import { buildWhatsAppUrl, formatPkr, t } from '../i18n/translations.ts';
import { SafeImage } from './SafeImage.tsx';

interface ProductCardProps {
  product: Product;
  onOpenProduct: (slug: string) => void;
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, onOpenProduct, layout = 'grid' }: ProductCardProps) {
  const { lang, settings, addToCart, wishlist, toggleWishlist } = useStore();
  const copy = t[lang];
  const [justAdded, setJustAdded] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const title = lang === 'ur' ? product.nameUr : product.nameEn;
  const secondaryTitle = lang === 'ur' ? product.nameEn : product.nameUr;
  const mainImage = product.images?.[0] || '';

  const discountPct =
    product.oldPricePkr && product.oldPricePkr > product.pricePkr
      ? Math.round(((product.oldPricePkr - product.pricePkr) / product.oldPricePkr) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stockQty <= 0) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const whatsappMessage =
    lang === 'ur'
      ? `السلام علیکم ماموں کمپیوٹرز، مجھے اس پروڈکٹ کے بارے میں معلومات درکار ہیں: ${product.nameEn} (${product.modelNumber}) - ${formatPkr(product.pricePkr)}`
      : `Assalam-o-Alaikum Mamoo Computers, I would like to inquire about: ${product.nameEn} (Model: ${product.modelNumber}) priced at ${formatPkr(product.pricePkr)}.`;

  const whatsappHref = buildWhatsAppUrl(settings?.whatsappNumber || '923004128950', whatsappMessage);

  const stockLabel =
    product.stockQty <= 0
      ? copy.outOfStock
      : product.stockQty <= 4
      ? copy.lowStock
      : copy.inStock;

  if (layout === 'list') {
    return (
      <article
        onClick={() => onOpenProduct(product.slug)}
        className="group cursor-pointer flex flex-col sm:flex-row gap-5 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-md"
      >
        <div className="relative w-full sm:w-56 aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <SafeImage
            src={mainImage}
            alt={title}
            fallbackLabel={product.brand}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {discountPct > 0 && (
            <span
              dir="ltr"
              className="absolute top-2.5 start-2.5 bg-[#0B1F3A] text-white text-xs font-semibold px-2 py-0.5 rounded font-mono tabular-nums"
            >
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 truncate">
                <span dir="ltr" className="font-semibold text-[#1D4ED8] uppercase tracking-wide">
                  {product.brand}
                </span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono tabular-nums text-slate-500 truncate">
                  {product.modelNumber}
                </span>
                {product.isDemo && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{copy.demoTag}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={isWishlisted ? copy.wishlistRemove : copy.wishlistAdd}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            <h3 className="mt-1.5 text-base font-semibold text-slate-900 group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{secondaryTitle}</p>
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {lang === 'ur' ? product.descriptionUr : product.descriptionEn}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span dir="ltr" className="text-lg font-bold text-[#0B1F3A] font-mono tabular-nums">
                  {formatPkr(product.pricePkr)}
                </span>
                {product.oldPricePkr && product.oldPricePkr > product.pricePkr && (
                  <span dir="ltr" className="text-xs text-slate-400 line-through font-mono tabular-nums">
                    {formatPkr(product.oldPricePkr)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    product.stockQty > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {product.stockQty > 0 ? (
                    <PackageCheck className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {stockLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span dir="ltr" className="font-mono tabular-nums">
                    {Number(product.rating).toFixed(1)} ({product.reviewsCount})
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{copy.whatsappInquiry}</span>
              </a>
              <button
                type="button"
                disabled={product.stockQty <= 0}
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:bg-slate-300 transition-colors whitespace-nowrap"
              >
                {justAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{justAdded ? copy.addedToCart : copy.addToCart}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onOpenProduct(product.slug)}
      className="group cursor-pointer flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <SafeImage
          src={mainImage}
          alt={title}
          fallbackLabel={product.brand}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? copy.wishlistRemove : copy.wishlistAdd}
          className="absolute top-2.5 end-2.5 flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 text-slate-600 shadow-sm hover:text-rose-600 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>
        {discountPct > 0 && (
          <span
            dir="ltr"
            className="absolute top-2.5 start-2.5 bg-[#0B1F3A] text-white text-xs font-semibold px-2 py-0.5 rounded font-mono tabular-nums"
          >
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span dir="ltr" className="font-semibold text-[#1D4ED8] uppercase tracking-wide shrink-0">
            {product.brand}
          </span>
          <span aria-hidden="true">·</span>
          <span dir="ltr" className="font-mono tabular-nums truncate">
            {product.modelNumber}
          </span>
          {product.isDemo && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 shrink-0">{copy.demoTag}</span>
            </>
          )}
        </div>

        <h3 className="mt-1.5 text-[15px] font-semibold text-slate-900 group-hover:text-[#1D4ED8] transition-colors line-clamp-2 min-h-[2.75rem]">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{secondaryTitle}</p>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              product.stockQty > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {product.stockQty > 0 ? (
              <PackageCheck className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{stockLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span dir="ltr" className="font-mono tabular-nums">
              {Number(product.rating).toFixed(1)} ({product.reviewsCount})
            </span>
          </span>
        </div>

        <div className="mt-auto pt-3.5">
          <div className="flex items-baseline gap-2">
            <span dir="ltr" className="text-lg font-bold text-[#0B1F3A] font-mono tabular-nums">
              {formatPkr(product.pricePkr)}
            </span>
            {product.oldPricePkr && product.oldPricePkr > product.pricePkr && (
              <span dir="ltr" className="text-xs text-slate-400 line-through font-mono tabular-nums">
                {formatPkr(product.oldPricePkr)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={product.stockQty <= 0}
              onClick={handleAdd}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:bg-slate-300 transition-colors whitespace-nowrap"
            >
              {justAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              <span>{justAdded ? copy.addedToCart : copy.addToCart}</span>
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={copy.whatsappInquiry}
              aria-label={copy.whatsappInquiry}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
