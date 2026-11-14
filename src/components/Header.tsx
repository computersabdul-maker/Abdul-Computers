import { useState } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { t } from '../i18n/translations.ts';
import { BrandMark } from './BrandMark.tsx';

export type AppView =
  | { name: 'home' }
  | { name: 'catalog'; category?: string; brand?: string; search?: string }
  | { name: 'product'; slug: string }
  | { name: 'checkout' }
  | { name: 'account' }
  | { name: 'admin' };

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Header({ currentView, onNavigate, searchQuery, onSearchChange }: HeaderProps) {
  const {
    lang,
    setLang,
    settings,
    cartCount,
    setCartOpen,
    wishlist,
    setWishlistOpen,
    dbUser,
  } = useStore();
  const copy = t[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeTitle =
    lang === 'ur'
      ? settings?.storeNameUr || copy.storeName
      : settings?.storeNameEn || copy.storeName;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate({ name: 'catalog', search: searchQuery.trim() });
    setMobileMenuOpen(false);
  };

  const navToHomeSection = (sectionId: string) => {
    onNavigate({ name: 'home' });
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-6">
        {/* Zone 1: Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate({ name: 'home' })}
          className="flex items-center gap-2.5 shrink-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-lg"
        >
          <BrandMark logoUrl={settings?.logoUrl} className="w-9 h-9 shrink-0" />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0B1F3A] whitespace-nowrap">
            {storeTitle}
          </span>
        </button>

        {/* Zone 2: Navigation Links + Search */}
        <div className="hidden lg:flex items-center gap-6 flex-1 min-w-0 justify-center">
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'home' })}
              className={`whitespace-nowrap transition-colors hover:text-[#1D4ED8] ${
                currentView.name === 'home' ? 'text-[#0B1F3A] font-semibold' : ''
              }`}
            >
              {copy.navHome}
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className={`whitespace-nowrap transition-colors hover:text-[#1D4ED8] ${
                currentView.name === 'catalog' ? 'text-[#0B1F3A] font-semibold' : ''
              }`}
            >
              {copy.navCatalog}
            </button>
            <button
              type="button"
              onClick={() => navToHomeSection('categories-section')}
              className="whitespace-nowrap transition-colors hover:text-[#1D4ED8]"
            >
              {copy.navCategories}
            </button>
            <button
              type="button"
              onClick={() => navToHomeSection('offers-section')}
              className="whitespace-nowrap transition-colors hover:text-[#1D4ED8]"
            >
              {copy.navOffers}
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'admin' })}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-[#1D4ED8] ${
                currentView.name === 'admin' ? 'text-[#1D4ED8] font-semibold' : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{copy.navAdmin}</span>
            </button>
          </nav>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 ps-3.5 pe-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label={copy.searchBtn}
              className="absolute inset-y-0 end-0 flex items-center px-2.5 text-slate-500 hover:text-[#1D4ED8]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Zone 3: Language Switcher + Account + Wishlist + Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                lang === 'en' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                lang === 'ur' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اردو
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'account' })}
            aria-label={copy.accountTitle}
            title={dbUser?.email || copy.accountTitle}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A] transition-colors"
          >
            <User className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            aria-label={copy.wishlistTitle}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A] transition-colors"
          >
            <Heart className="w-4.5 h-4.5" />
            {wishlist.length > 0 && (
              <span
                dir="ltr"
                className="absolute -top-0.5 -end-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold flex items-center justify-center font-mono tabular-nums"
              >
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={copy.cartTitle}
            className="relative inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            <span dir="ltr" className="font-mono tabular-nums">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle Menu"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 ps-3.5 pe-10 text-sm text-slate-900 focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label={copy.searchBtn}
              className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-500"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <nav className="grid grid-cols-2 gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                onNavigate({ name: 'home' });
                setMobileMenuOpen(false);
              }}
              className="text-start px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              {copy.navHome}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate({ name: 'catalog' });
                setMobileMenuOpen(false);
              }}
              className="text-start px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              {copy.navCatalog}
            </button>
            <button
              type="button"
              onClick={() => navToHomeSection('categories-section')}
              className="text-start px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              {copy.navCategories}
            </button>
            <button
              type="button"
              onClick={() => navToHomeSection('offers-section')}
              className="text-start px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              {copy.navOffers}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate({ name: 'account' });
                setMobileMenuOpen(false);
              }}
              className="text-start px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              {copy.accountTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate({ name: 'admin' });
                setMobileMenuOpen(false);
              }}
              className="text-start px-3 py-2.5 rounded-lg bg-blue-50 text-[#1D4ED8] font-semibold"
            >
              {copy.navAdmin}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
