import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { t } from '../i18n/translations.ts';
import { Product } from '../types/store.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { AppView } from '../components/Header.tsx';

interface CatalogPageProps {
  initialCategory?: string;
  initialBrand?: string;
  initialSearch?: string;
  onNavigate: (view: AppView) => void;
}

export function CatalogPage({
  initialCategory = 'all',
  initialBrand = 'all',
  initialSearch = '',
  onNavigate,
}: CatalogPageProps) {
  const { lang, categories, products: allProducts } = useStore();
  const copy = t[lang];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(initialSearch);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setCategorySlug(initialCategory || 'all');
    setBrand(initialBrand || 'all');
    setSearch(initialSearch || '');
  }, [initialCategory, initialBrand, initialSearch]);

  const brands = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.brand));
    return Array.from(set).sort();
  }, [allProducts]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('q', search.trim());
        if (categorySlug && categorySlug !== 'all') params.set('category', categorySlug);
        if (brand && brand !== 'all') params.set('brand', brand);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (inStockOnly) params.set('inStock', 'true');
        params.set('sort', sort);

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const rows = await res.json();
          setFilteredProducts(rows);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Catalog filter error:', err);
        }
      } finally {
        setFetching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, categorySlug, brand, minPrice, maxPrice, inStockOnly, sort, allProducts]);

  const clearFilters = () => {
    setSearch('');
    setCategorySlug('all');
    setBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSort('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            {copy.catalogTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {copy.showingResults.replace('{count}', String(filteredProducts.length))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label={copy.sortBy}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none"
          >
            <option value="newest">{copy.sortNewest}</option>
            <option value="price_asc">{copy.sortPriceAsc}</option>
            <option value="price_desc">{copy.sortPriceDesc}</option>
            <option value="popular">{copy.sortPopular}</option>
          </select>

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-[#0B1F3A] text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-[#0B1F3A] text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
                <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8]" />
                <span>{copy.filters}</span>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-[#1D4ED8] hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{copy.clearFilters}</span>
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.searchBtn}
              </label>
              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 ps-3 pe-8 text-xs focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-2.5" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.categoryLabel}
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:border-[#1D4ED8] focus:outline-none"
              >
                <option value="all">{copy.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {lang === 'ur' ? cat.nameUr : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.brandLabel}
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:border-[#1D4ED8] focus:outline-none"
              >
                <option value="all">{copy.allBrands}</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {copy.priceRange}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={copy.minPrice}
                  className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-mono tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={copy.maxPrice}
                  className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-mono tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>

            {/* Availability */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 pt-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
              />
              <span>{copy.inStockOnly}</span>
            </label>
          </div>
        </aside>

        {/* Product Results */}
        <div className="lg:col-span-9">
          {fetching && filteredProducts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm text-slate-600">{copy.noResults}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {copy.clearFilters}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout="grid"
                  onOpenProduct={(slug) => onNavigate({ name: 'product', slug })}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout="list"
                  onOpenProduct={(slug) => onNavigate({ name: 'product', slug })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
