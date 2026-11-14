import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Award,
  BadgePercent,
  CheckCircle2,
  Headphones,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { t } from '../i18n/translations.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { BrandLogos } from '../components/BrandLogos.tsx';
import { AppView } from '../components/Header.tsx';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { lang, settings, categories, products, reviews, refreshStore } = useStore();
  const copy = t[lang];
  const ArrowIcon = lang === 'ur' ? ArrowLeft : ArrowRight;

  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorCity, setAuthorCity] = useState('');
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const latestArrivals = products.filter((p) => p.isLatest).slice(0, 4);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    setSubmittingReview(true);
    setReviewFeedback(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          authorCity: authorCity || 'Lahore',
          rating,
          commentEn: commentText,
          commentUr: commentText,
        }),
      });
      if (!res.ok) throw new Error('Could not submit review');
      setAuthorName('');
      setAuthorCity('');
      setCommentText('');
      setReviewFormOpen(false);
      setReviewFeedback(
        lang === 'ur'
          ? 'آپ کا تبصرہ کامیابی سے شامل ہو گیا ہے۔'
          : 'Your review has been published.'
      );
      await refreshStore();
    } catch {
      setReviewFeedback(
        lang === 'ur' ? 'تبصرہ محفوظ کرنے میں مسئلہ پیش آیا۔' : 'Unable to submit review.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* B. Hero Banner */}
      <section className="bg-[#0B1F3A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-medium text-blue-300 tracking-wide">
              {lang === 'ur' ? 'ماموں کمپیوٹرز · لاہور سے پاکستان بھر میں ڈیلیوری' : 'Mamoo Computers · Nationwide Pakistan Delivery'}
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-white text-balance leading-[1.2]">
              {lang === 'ur'
                ? settings?.heroTitleUr || 'آپ کی ڈیجیٹل دنیا کی ہر ضرورت، ایک ہی جگہ'
                : settings?.heroTitleEn || 'Everything You Need for Your Digital World'}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              {lang === 'ur'
                ? settings?.heroSubtitleUr ||
                  'کمپیوٹرز، لیپ ٹاپس، پارٹس اور جدید ترین ٹیکنالوجی مناسب قیمتوں پر حاصل کریں۔'
                : settings?.heroSubtitleEn ||
                  'Explore computers, laptops, accessories and the latest technology at great prices.'}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate({ name: 'catalog' })}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                <span>{copy.shopNow}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-white hover:border-slate-400 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
              >
                <span>{copy.exploreProducts}</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="block font-semibold text-white">
                  {lang === 'ur' ? 'آفیشل وارنٹی' : 'Official Warranty'}
                </span>
                <span>{lang === 'ur' ? '100% اصل مصنوعات' : '100% Sealed Hardware'}</span>
              </div>
              <div>
                <span className="block font-semibold text-white">
                  {lang === 'ur' ? 'کیش آن ڈیلیوری' : 'Cash on Delivery'}
                </span>
                <span>{lang === 'ur' ? 'پاکستان بھر میں' : 'Across Pakistan'}</span>
              </div>
              <div>
                <span className="block font-semibold text-white">
                  {lang === 'ur' ? 'ہال روڈ قیمتیں' : 'Competitive PKR'}
                </span>
                <span>{lang === 'ur' ? 'شفاف نرخ' : 'Transparent Pricing'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-900 min-h-[260px] lg:min-h-[380px]">
              <SafeImage
                src={settings?.heroImageUrl || '/src/assets/images/hero_mamoo_computers_1794665755645.jpg'}
                alt="Mamoo Computers Workstation Showcase"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Demo Catalog Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs text-slate-700">
          <span>{copy.demoNotice}</span>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
          >
            {copy.viewAllProducts}
          </button>
        </div>
      </div>

      {/* C. Product Categories (16 Computer Categories) */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {copy.categoriesTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{copy.categoriesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#0B1F3A] whitespace-nowrap"
          >
            <span>{copy.viewAllProducts}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigate({ name: 'catalog', category: cat.slug })}
              className="group text-start rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[#1D4ED8] hover:shadow-sm"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <SafeImage
                  src={cat.imageUrl}
                  alt={lang === 'ur' ? cat.nameUr : cat.nameEn}
                  fallbackLabel={cat.nameEn}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#1D4ED8] transition-colors line-clamp-1">
                  {lang === 'ur' ? cat.nameUr : cat.nameEn}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                  {lang === 'ur' ? cat.nameEn : cat.nameUr}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* D. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {copy.featuredTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{copy.featuredSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#0B1F3A] whitespace-nowrap"
          >
            <span>{copy.viewAllProducts}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenProduct={(slug) => onNavigate({ name: 'product', slug })}
            />
          ))}
        </div>
      </section>

      {/* E. Best Sellers */}
      <section className="bg-slate-100/80 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
                {copy.bestSellersTitle}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">{copy.bestSellersSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#0B1F3A] whitespace-nowrap"
            >
              <span>{copy.viewAllProducts}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProduct={(slug) => onNavigate({ name: 'product', slug })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* F. Latest Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {copy.latestTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{copy.latestSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#0B1F3A] whitespace-nowrap"
          >
            <span>{copy.viewAllProducts}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {latestArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenProduct={(slug) => onNavigate({ name: 'product', slug })}
            />
          ))}
        </div>
      </section>

      {/* G. Special Offers */}
      <section id="offers-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            {copy.offersTitle}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">{copy.offersSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(settings?.offers || []).map((offer) => (
            <div
              key={offer.id}
              onClick={() => onNavigate({ name: 'catalog', category: offer.categorySlug })}
              className="group cursor-pointer grid grid-cols-1 sm:grid-cols-12 rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-150 hover:border-[#1D4ED8] hover:shadow-md items-stretch"
            >
              <div className="sm:col-span-7 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1D4ED8]">
                    {lang === 'ur' ? offer.discountLabelUr : offer.discountLabelEn}
                  </span>
                  <h3 className="mt-1.5 font-display text-xl font-bold text-[#0B1F3A] group-hover:text-[#1D4ED8] transition-colors">
                    {lang === 'ur' ? offer.titleUr : offer.titleEn}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {lang === 'ur' ? offer.subtitleUr : offer.subtitleEn}
                  </p>
                </div>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] group-hover:text-[#1D4ED8]">
                  <span>{copy.shopNow}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="sm:col-span-5 bg-slate-100 min-h-[160px]">
                <SafeImage
                  src={offer.imageUrl}
                  alt={offer.titleEn}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* H. Trusted Brands */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            {copy.brandsTitle}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">{copy.brandsSubtitle}</p>
        </div>
        <BrandLogos onSelectBrand={(brand) => onNavigate({ name: 'catalog', brand })} />
      </section>

      {/* I. Why Choose Mamoo Computers? */}
      <section className="bg-[#0B1F3A] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {copy.whyTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{copy.whySubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: copy.whyQualityTitle, desc: copy.whyQualityDesc },
              { icon: BadgePercent, title: copy.whyPriceTitle, desc: copy.whyPriceDesc },
              { icon: Headphones, title: copy.whySupportTitle, desc: copy.whySupportDesc },
              { icon: Truck, title: copy.whyTrustTitle, desc: copy.whyTrustDesc },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-6 flex flex-col"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* J. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {copy.reviewsTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{copy.reviewsSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setReviewFormOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            {copy.writeReview}
          </button>
        </div>

        {reviewFeedback && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {reviewFeedback}
          </div>
        )}

        {reviewFormOpen && (
          <form
            onSubmit={handleReviewSubmit}
            className="mb-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {copy.yourName}
                </label>
                <input
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {copy.yourCity}
                </label>
                <input
                  value={authorCity}
                  onChange={(e) => setAuthorCity(e.target.value)}
                  placeholder="Lahore / Karachi / Islamabad"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {copy.ratingLabel}
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1D4ED8] focus:outline-none bg-white"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {copy.reviewCommentEn}
              </label>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewFormOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="rounded-lg bg-[#1D4ED8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
              >
                {copy.submitReview}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.slice(0, 6).map((rev) => (
            <article
              key={rev.id}
              className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      rev.isSample
                        ? 'text-slate-500'
                        : rev.isVerified
                        ? 'text-emerald-700'
                        : 'text-[#1D4ED8]'
                    }`}
                  >
                    {rev.isVerified ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {rev.isSample
                        ? copy.sampleReviewBadge
                        : rev.isVerified
                        ? copy.verifiedReviewBadge
                        : copy.communityReviewBadge}
                    </span>
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                  “{lang === 'ur' ? rev.commentUr : rev.commentEn}”
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0B1F3A]">{rev.authorName}</span>
                <span className="text-slate-500">{rev.authorCity}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
