interface BrandLogosProps {
  onSelectBrand: (brand: string) => void;
}

const TRUSTED_BRANDS = [
  { name: 'HP', subtitle: 'Laptops & Workstations' },
  { name: 'Dell', subtitle: 'Latitude & UltraSharp' },
  { name: 'Lenovo', subtitle: 'ThinkPad & Hubs' },
  { name: 'Acer', subtitle: 'Monitors & Security' },
  { name: 'ASUS', subtitle: 'Graphics & Motherboards' },
  { name: 'MSI', subtitle: 'Power & Gaming' },
  { name: 'Intel', subtitle: 'Core Processors' },
  { name: 'AMD', subtitle: 'Ryzen & Cooling' },
  { name: 'Samsung', subtitle: 'NVMe & SATA SSD' },
  { name: 'Kingston', subtitle: 'FURY RAM & Flash' },
  { name: 'Logitech', subtitle: 'Keyboards & Mice' },
  { name: 'Canon', subtitle: 'MegaTank Printers' },
  { name: 'Epson', subtitle: 'EcoTank Printers' },
  { name: 'WD', subtitle: 'Desktop & External HDD' },
  { name: 'TP-Link', subtitle: 'Wi-Fi 6 Networking' },
];

export function BrandLogos({ onSelectBrand }: BrandLogosProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
      {TRUSTED_BRANDS.map((brand) => (
        <button
          key={brand.name}
          type="button"
          onClick={() => onSelectBrand(brand.name)}
          className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-5 text-center transition-all duration-150 hover:border-[#1D4ED8] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <span
            dir="ltr"
            className="font-display text-lg font-extrabold tracking-tight text-[#0B1F3A] group-hover:text-[#1D4ED8] transition-colors"
          >
            {brand.name}
          </span>
          <span dir="ltr" className="mt-1 text-xs text-slate-500">
            {brand.subtitle}
          </span>
        </button>
      ))}
    </div>
  );
}
