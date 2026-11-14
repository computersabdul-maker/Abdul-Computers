interface BrandMarkProps {
  logoUrl?: string | null;
  className?: string;
}

export function BrandMark({ logoUrl, className = 'w-9 h-9' }: BrandMarkProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Mamoo Computers Logo"
        referrerPolicy="no-referrer"
        className={`${className} rounded-lg object-contain bg-white p-0.5`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="9" fill="#0B1F3A" />
      <rect x="7" y="9" width="26" height="18" rx="3" stroke="#FFFFFF" strokeWidth="2.2" />
      <path d="M14 31H26" stroke="#60A5FA" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 27V31" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M13 21V15L17 19L21 15V21"
        stroke="#60A5FA"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="18" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}
