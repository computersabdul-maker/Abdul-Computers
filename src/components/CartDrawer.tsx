import { Minus, Plus, ShoppingBag, Trash2, X, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { buildWhatsAppUrl, formatPkr, t } from '../i18n/translations.ts';
import { SafeImage } from './SafeImage.tsx';

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const {
    lang,
    settings,
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
  } = useStore();
  const copy = t[lang];

  if (!cartOpen) return null;

  const freeThreshold = settings?.freeDeliveryThresholdPkr ?? 30000;
  const deliveryFee = cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : settings?.deliveryFeePkr ?? 500;
  const grandTotal = cartSubtotal + deliveryFee;
  const remaining = Math.max(0, freeThreshold - cartSubtotal);

  const whatsappSummary = [
    lang === 'ur' ? 'السلام علیکم ماموں کمپیوٹرز، میرا آرڈر:' : 'Assalam-o-Alaikum Mamoo Computers, I want to order:',
    ...cart.map(
      (item, idx) =>
        `${idx + 1}. ${item.product.nameEn} (${item.product.modelNumber}) x${item.quantity} = ${formatPkr(
          item.product.pricePkr * item.quantity
        )}`
    ),
    `Subtotal: ${formatPkr(cartSubtotal)}`,
    `Delivery: ${deliveryFee === 0 ? 'Free' : formatPkr(deliveryFee)}`,
    `Total: ${formatPkr(grandTotal)}`,
  ].join('\n');

  const whatsappHref = buildWhatsAppUrl(settings?.whatsappNumber || '923004128950', whatsappSummary);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[1px]">
      <div className="fixed inset-0" onClick={() => setCartOpen(false)} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#1D4ED8]" />
            <h2 className="text-base font-bold text-[#0B1F3A]">{copy.cartTitle}</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 text-xs text-slate-600">
            {remaining > 0 ? (
              <span>
                {copy.freeDeliveryProgress.replace('{amount}', formatPkr(remaining))}
              </span>
            ) : (
              <span className="font-medium text-emerald-700">{copy.freeDeliveryUnlocked}</span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600">{copy.cartEmpty}</p>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-4 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {copy.continueShopping}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3.5 rounded-xl border border-slate-200 p-3 bg-white"
              >
                <SafeImage
                  src={item.product.images?.[0]}
                  alt={item.product.nameEn}
                  fallbackLabel={item.product.brand}
                  className="w-20 h-16 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {lang === 'ur' ? item.product.nameUr : item.product.nameEn}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Remove item"
                      className="text-slate-400 hover:text-rose-600 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p dir="ltr" className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {formatPkr(item.product.pricePkr)}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span dir="ltr" className="px-3 text-xs font-semibold font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span dir="ltr" className="text-sm font-bold text-[#0B1F3A] font-mono tabular-nums">
                      {formatPkr(item.product.pricePkr * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{copy.subtotal}</span>
                <span dir="ltr" className="font-mono tabular-nums font-medium text-slate-900">
                  {formatPkr(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{copy.deliveryFee}</span>
                <span dir="ltr" className="font-mono tabular-nums font-medium text-slate-900">
                  {deliveryFee === 0 ? copy.freeDelivery : formatPkr(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-[#0B1F3A]">
                <span>{copy.grandTotal}</span>
                <span dir="ltr" className="font-mono tabular-nums">
                  {formatPkr(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                onCheckout();
              }}
              className="w-full rounded-lg bg-[#1D4ED8] py-3 text-sm font-semibold text-white hover:bg-[#0B1F3A] transition-colors"
            >
              {copy.proceedCheckout}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{copy.orderViaWhatsapp}</span>
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
