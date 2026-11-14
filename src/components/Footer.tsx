import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { buildWhatsAppUrl, t } from '../i18n/translations.ts';
import { BrandMark } from './BrandMark.tsx';
import { AppView } from './Header.tsx';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { lang, settings, categories } = useStore();
  const copy = t[lang];

  const storeTitle =
    lang === 'ur'
      ? settings?.storeNameUr || copy.storeName
      : settings?.storeNameEn || copy.storeName;

  const address =
    lang === 'ur'
      ? settings?.addressUr || 'دکان نمبر 14، ہال روڈ کمپیوٹر مارکیٹ، لاہور، پاکستان'
      : settings?.addressEn || 'Shop #14, Hall Road Computer Market, Lahore, Pakistan';

  const whatsappHref = buildWhatsAppUrl(
    settings?.whatsappNumber || '923004128950',
    lang === 'ur'
      ? 'السلام علیکم ماموں کمپیوٹرز، مجھے پروڈکٹ کے بارے میں معلومات درکار ہیں۔'
      : 'Assalam-o-Alaikum Mamoo Computers, I would like to ask about a computer product.'
  );

  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Brand & Intro */}
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark logoUrl={settings?.logoUrl} className="w-9 h-9" />
            <span className="font-display text-lg font-bold text-white">{storeTitle}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {lang === 'ur'
              ? 'ماموں کمپیوٹرز پاکستان بھر میں معیاری لیپ ٹاپس، ڈیسک ٹاپ کمپیوٹرز، پروسیسرز، ایس ایس ڈی اور آفس پرنٹرز مناسب قیمت اور وارنٹی کے ساتھ فراہم کرتا ہے۔'
              : 'Mamoo Computers supplies authentic laptops, desktop workstations, processors, SSDs, graphics cards, and office printers across Pakistan with nationwide Cash on Delivery.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline underline-offset-4"
              >
                Facebook
              </a>
            )}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline underline-offset-4"
              >
                Instagram
              </a>
            )}
            {settings?.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline underline-offset-4"
              >
                YouTube
              </a>
            )}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{copy.quickLinks}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'home' })}
                className="hover:text-white transition-colors"
              >
                {copy.navHome}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'catalog' })}
                className="hover:text-white transition-colors"
              >
                {copy.navCatalog}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'checkout' })}
                className="hover:text-white transition-colors"
              >
                {copy.checkoutTitle}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'account' })}
                className="hover:text-white transition-colors"
              >
                {copy.trackOrderTitle}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'admin' })}
                className="hover:text-white transition-colors"
              >
                {copy.adminTitle}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Top Categories */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{copy.topCategories}</h3>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'catalog', category: cat.slug })}
                  className="hover:text-white transition-colors text-start"
                >
                  {lang === 'ur' ? cat.nameUr : cat.nameEn}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact & WhatsApp */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{copy.contactInfo}</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span dir="ltr" className="font-mono tabular-nums">
                {settings?.phone || '+92 300 4128950'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span dir="ltr">{settings?.email || 'sales@mamoocomputers.pk'}</span>
            </li>
          </ul>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{copy.chatWhatsapp}</span>
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} {storeTitle}. {copy.rightsReserved}
          </span>
          <span>{copy.demoNotice}</span>
        </div>
      </div>
    </footer>
  );
}
