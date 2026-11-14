import { useState } from 'react';
import { CheckCircle2, CreditCard, MessageCircle, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { buildWhatsAppUrl, formatPkr, t } from '../i18n/translations.ts';
import { Order } from '../types/store.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { AppView } from '../components/Header.tsx';

interface CheckoutPageProps {
  onNavigate: (view: AppView) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { lang, settings, cart, cartSubtotal, clearCart, getIdToken, refreshStore } = useStore();
  const copy = t[lang];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const freeThreshold = settings?.freeDeliveryThresholdPkr ?? 30000;
  const deliveryFee =
    cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : settings?.deliveryFeePkr ?? 500;
  const grandTotal = cartSubtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName,
          customerPhone,
          city,
          deliveryAddress,
          paymentMethod,
          notes,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order submission failed');

      setConfirmedOrder(data.order);
      clearCart();
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const waText = [
      `Assalam-o-Alaikum Mamoo Computers!`,
      `Order Number: ${confirmedOrder.orderNumber}`,
      `Customer: ${confirmedOrder.customerName} (${confirmedOrder.customerPhone})`,
      `City: ${confirmedOrder.city}`,
      `Payment: ${confirmedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}`,
      ...confirmedOrder.items.map(
        (it, i) => `${i + 1}. ${it.nameEn} x${it.quantity} = ${formatPkr(it.pricePkr * it.quantity)}`
      ),
      `Total: ${formatPkr(confirmedOrder.totalPkr)}`,
    ].join('\n');

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#0B1F3A]">
            {copy.orderConfirmedTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{copy.orderConfirmedDesc}</p>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 inline-block">
            <span className="text-xs text-slate-500 block">{copy.orderNumberLabel}</span>
            <span dir="ltr" className="text-xl font-bold text-[#1D4ED8] font-mono tabular-nums">
              {confirmedOrder.orderNumber}
            </span>
          </div>

          <div className="mt-6 text-start rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="text-slate-700">
                  {lang === 'ur' ? item.nameUr : item.nameEn} × {item.quantity}
                </span>
                <span dir="ltr" className="font-mono tabular-nums font-semibold">
                  {formatPkr(item.pricePkr * item.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-[#0B1F3A]">
              <span>{copy.grandTotal}</span>
              <span dir="ltr" className="font-mono tabular-nums">
                {formatPkr(confirmedOrder.totalPkr)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={buildWhatsAppUrl(settings?.whatsappNumber || '923004128950', waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{copy.sendOrderWhatsapp}</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'home' })}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copy.continueShopping}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h1 className="font-display text-xl font-bold text-[#0B1F3A]">{copy.cartEmpty}</h1>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'catalog' })}
          className="mt-4 rounded-lg bg-[#1D4ED8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0B1F3A]"
        >
          {copy.shopNow}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] mb-8">
        {copy.checkoutTitle}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0B1F3A]">{copy.customerDetails}</h2>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {copy.fullName} *
                </label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 px-3.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {copy.phoneNumber} *
                </label>
                <input
                  required
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full h-11 rounded-lg border border-slate-300 px-3.5 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.cityLabel} *
              </label>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore, Karachi, Islamabad, Rawalpindi..."
                className="w-full h-11 rounded-lg border border-slate-300 px-3.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.addressLabel} *
              </label>
              <textarea
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.orderNotes}
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-300 px-3.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0B1F3A]">{copy.paymentMethod}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`text-start rounded-xl border p-4 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#1D4ED8] bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-[#0B1F3A]">
                  <Truck className="w-4 h-4 text-[#1D4ED8]" />
                  <span>{copy.codLabel}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600">{copy.codDesc}</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`text-start rounded-xl border p-4 transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#1D4ED8] bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-[#0B1F3A]">
                  <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
                  <span>{copy.bankLabel}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600">{copy.bankDesc}</p>
              </button>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700">
                {lang === 'ur' ? settings?.bankDetailsUr : settings?.bankDetailsEn}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-[#0B1F3A]">{copy.checkoutTitle}</h2>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="py-3 flex items-center gap-3">
                <SafeImage
                  src={item.product.images?.[0]}
                  alt={item.product.nameEn}
                  className="w-14 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">
                    {lang === 'ur' ? item.product.nameUr : item.product.nameEn}
                  </p>
                  <p dir="ltr" className="text-xs text-slate-500 font-mono tabular-nums">
                    {item.quantity} × {formatPkr(item.product.pricePkr)}
                  </p>
                </div>
                <span dir="ltr" className="text-sm font-bold text-[#0B1F3A] font-mono tabular-nums shrink-0">
                  {formatPkr(item.product.pricePkr * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
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
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#1D4ED8] py-3.5 text-sm font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50 transition-colors"
          >
            {submitting ? copy.placingOrder : copy.placeOrder}
          </button>
        </div>
      </form>
    </div>
  );
}
