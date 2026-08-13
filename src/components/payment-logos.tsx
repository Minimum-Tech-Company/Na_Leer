export function WaveLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#1DC3F0"/>
      <path d="M28 14c2.5-3 6.5-4 10-4 8 0 14 6 14 14s-6 14-14 14c-3.5 0-7.5-1-10-4" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M38 24c1.5-2 4-3 6-3 5 0 8 4 8 8s-3 8-8 8c-2 0-4.5-1-6-3" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <text x="68" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16">Wave</text>
    </svg>
  )
}

export function OrangeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#FF6600"/>
      <circle cx="24" cy="20" r="10" fill="white" opacity="0.9"/>
      <circle cx="24" cy="20" r="6" fill="#FF6600"/>
      <text x="40" y="25" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="11">Orange</text>
      <text x="40" y="33" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="9" opacity="0.8">Money</text>
    </svg>
  )
}

export function FreeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#E2001A"/>
      <text x="14" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16">FREE</text>
      <text x="68" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="normal" fontSize="11">Money</text>
    </svg>
  )
}

export function VisaLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
      <text x="12" y="28" fill="#1A1F71" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" fontStyle="italic">VISA</text>
    </svg>
  )
}

export function MastercardLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
      <circle cx="32" cy="20" r="12" fill="#EB001B" opacity="0.9"/>
      <circle cx="48" cy="20" r="12" fill="#F79E1B" opacity="0.9"/>
    </svg>
  )
}

export function WizallLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#00A651"/>
      <text x="14" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16">Wizall</text>
    </svg>
  )
}
