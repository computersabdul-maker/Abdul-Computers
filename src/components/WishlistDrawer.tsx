import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatPkr, t } from '../i18n/translations.ts';
import { SafeImage } from './SafeImage.tsx';

interface WishlistDrawerProps {
  onOpenProduct: (slug: string) => void;
}

export function WishlistDrawer({ onOpenProduct }: WishlistDrawerProps) {
  const {
    lang,
    products,
    wishlist,
    toggleWishlist,
    wishlistOpen,
    setWishlistOpen,
    addToCart,
    setCartOpen,
  } = useStore();
  const copy = t[lang];

  if (!wishlistOpen) return null;

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[1px]">
      <div className="fixed inset-0" onClick={() => setWishlistOpen(false)} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-[#0B1F3A]">{copy.wishlistTitle}</h2>
          </div>
          <button
            type="button"
            onClick={() => setWishlistOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {savedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Heart className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600">{copy.wishlistEmpty}</p>
            </div>
          ) : (
            savedProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-3 rounded-xl border border-slate-200 p-3 bg-white"
              >
                <SafeImage
                  src={product.images?.[0]}
                  alt={product.nameEn}
                  fallbackLabel={product.brand}
                  className="w-20 h-16 rounded-lg object-cover bg-slate-100 shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setWishlistOpen(false);
                      onOpenProduct(product.slug);
                    }}
                    className="text-start text-sm font-semibold text-slate-900 hover:text-[#1D4ED8] line-clamp-1"
                  >
                    {lang === 'ur' ? product.nameUr : product.nameEn}
                  </button>
                  <p dir="ltr" className="text-xs font-bold text-[#0B1F3A] font-mono tabular-nums mt-0.5">
                    {formatPkr(product.pricePkr)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={product.stockQty <= 0}
                      onClick={() => {
                        addToCart(product, 1);
                        setWishlistOpen(false);
                        setCartOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-[#1D4ED8] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:bg-slate-300"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{copy.addToCart}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{copy.delete}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
