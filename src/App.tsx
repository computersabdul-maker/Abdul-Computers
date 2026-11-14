import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { AppView, Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

function StoreShell() {
  const { lang, loading, error, refreshStore } = useStore();
  const [view, setView] = useState<AppView>({ name: 'home' });
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = (next: AppView) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const titles: Record<AppView['name'], string> = {
      home:
        lang === 'ur'
          ? 'ماموں کمپیوٹرز | لیپ ٹاپ، ڈیسک ٹاپ اور کمپیوٹر پارٹس اسٹور'
          : 'Mamoo Computers | Premium Laptops, PCs & Tech Store Pakistan',
      catalog:
        lang === 'ur'
          ? 'تمام مصنوعات | ماموں کمپیوٹرز'
          : 'Catalog | Mamoo Computers Pakistan',
      product: 'Mamoo Computers | Product Details',
      checkout:
        lang === 'ur'
          ? 'چیک آؤٹ | ماموں کمپیوٹرز'
          : 'Checkout | Mamoo Computers',
      account:
        lang === 'ur'
          ? 'کسٹمر اکاؤنٹ | ماموں کمپیوٹرز'
          : 'Customer Account | Mamoo Computers',
      admin:
        lang === 'ur'
          ? 'ایڈمن ڈیش بورڈ | ماموں کمپیوٹرز'
          : 'Admin Dashboard | Mamoo Computers',
    };
    if (view.name !== 'product') {
      document.title = titles[view.name];
    }
  }, [view.name, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header
        currentView={view}
        onNavigate={navigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6">
            <div className="h-80 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 rounded-xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-base font-medium text-rose-700">{error}</p>
            <button
              type="button"
              onClick={refreshStore}
              className="rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {lang === 'ur' ? 'دوبارہ کوشش کریں' : 'Retry'}
            </button>
          </div>
        ) : view.name === 'home' ? (
          <HomePage onNavigate={navigate} />
        ) : view.name === 'catalog' ? (
          <CatalogPage
            initialCategory={view.category}
            initialBrand={view.brand}
            initialSearch={view.search ?? searchQuery}
            onNavigate={navigate}
          />
        ) : view.name === 'product' ? (
          <ProductDetailPage slug={view.slug} onNavigate={navigate} />
        ) : view.name === 'checkout' ? (
          <CheckoutPage onNavigate={navigate} />
        ) : view.name === 'account' ? (
          <AccountPage onNavigate={navigate} />
        ) : (
          <AdminPage />
        )}
      </main>

      <Footer onNavigate={navigate} />
      <CartDrawer onCheckout={() => navigate({ name: 'checkout' })} />
      <WishlistDrawer onOpenProduct={(slug) => navigate({ name: 'product', slug })} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreShell />
    </StoreProvider>
  );
}
