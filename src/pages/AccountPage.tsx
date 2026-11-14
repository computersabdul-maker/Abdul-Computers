import { useEffect, useState } from 'react';
import { LogIn, LogOut, Package, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatPkr, getStatusLabel, t } from '../i18n/translations.ts';
import { Order, OrderStatus } from '../types/store.ts';
import { AppView } from '../components/Header.tsx';

interface AccountPageProps {
  onNavigate: (view: AppView) => void;
}

export function AccountPage({ onNavigate }: AccountPageProps) {
  const { lang, user, dbUser, signInWithGoogle, signOutUser, getIdToken } = useStore();
  const copy = t[lang];

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupOrder, setLookupOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }
    setLoadingOrders(true);
    getIdToken()
      .then((token) =>
        fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => setMyOrders(data.orders || []))
      .catch(() => setMyOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [user, getIdToken]);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupOrder(null);
    try {
      const res = await fetch(
        `/api/orders/lookup?orderNumber=${encodeURIComponent(lookupNumber)}&phone=${encodeURIComponent(
          lookupPhone
        )}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      setLookupOrder(data.order);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Unable to find order');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            {copy.accountTitle}
          </h1>
          {user && (
            <p className="mt-1 text-sm text-slate-600">
              {user.displayName || user.email} · {user.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {dbUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate({ name: 'admin' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{copy.adminTitle}</span>
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{copy.signOut}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <LogIn className="w-4 h-4" />
              <span>{copy.signInGoogle}</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Order Lookup */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0B1F3A]">{copy.trackOrderTitle}</h2>
        <form onSubmit={handleTrackOrder} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            dir="ltr"
            value={lookupNumber}
            onChange={(e) => setLookupNumber(e.target.value)}
            placeholder="MC-123456-789"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none"
          />
          <input
            required
            dir="ltr"
            value={lookupPhone}
            onChange={(e) => setLookupPhone(e.target.value)}
            placeholder={copy.phoneNumber}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#0B1F3A]"
          >
            <Search className="w-4 h-4" />
            <span>{copy.trackOrderBtn}</span>
          </button>
        </form>

        {lookupError && <p className="text-sm text-rose-600">{lookupError}</p>}

        {lookupOrder && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span dir="ltr" className="font-mono font-bold text-[#0B1F3A]">
                {lookupOrder.orderNumber}
              </span>
              <span className="font-semibold text-[#1D4ED8]">
                {getStatusLabel(lookupOrder.status as OrderStatus, lang)}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {lookupOrder.customerName} · {lookupOrder.city} · {formatPkr(lookupOrder.totalPkr)}
            </p>
          </div>
        )}
      </section>

      {/* Signed-in Customer Orders */}
      {user && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">{copy.myOrders}</h2>
          {loadingOrders ? (
            <div className="h-32 rounded-xl bg-slate-200/70 animate-pulse" />
          ) : myOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              {lang === 'ur' ? 'آپ کا ابھی کوئی آرڈر موجود نہیں ہے۔' : 'You have not placed any orders yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span dir="ltr" className="font-mono font-bold text-[#0B1F3A]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#1D4ED8]">
                        {getStatusLabel(ord.status as OrderStatus, lang)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {ord.items.map((i) => `${i.nameEn} (×${i.quantity})`).join(', ')}
                    </p>
                  </div>
                  <div className="text-end">
                    <span dir="ltr" className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                      {formatPkr(ord.totalPkr)}
                    </span>
                    <p className="text-xs text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
