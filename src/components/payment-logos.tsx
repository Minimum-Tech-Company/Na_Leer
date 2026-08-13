export function WaveLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="140" height="40" rx="8" fill="#1DC3F0"/>
      {/* Wave icon - stylized W like the real logo */}
      <path d="M8 28 L14 14 L20 24 L26 12 L32 22 L36 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <text x="44" y="26" fill="white" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="18" letterSpacing="-0.5">wave</text>
    </svg>
  )
}

export function OrangeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="40" rx="8" fill="#FF7900"/>
      {/* Orange square logo mark */}
      <rect x="8" y="6" width="28" height="28" rx="4" fill="white"/>
      <text x="13" y="27" fill="#FF7900" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18">O</text>
      {/* Text */}
      <text x="44" y="19" fill="white" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13">Orange</text>
      <text x="44" y="33" fill="white" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" opacity="0.9">Money</text>
    </svg>
  )
}

export function FreeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="140" height="40" rx="8" fill="#E2001A"/>
      <text x="12" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="17" letterSpacing="1">FREE</text>
      <text x="78" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="13">Money</text>
    </svg>
  )
}

export function VisaLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
      <text x="10" y="28" fill="#1A1F71" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="22" fontStyle="italic">VISA</text>
    </svg>
  )
}

export function MastercardLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
      <circle cx="30" cy="20" r="13" fill="#EB001B"/>
      <circle cx="50" cy="20" r="13" fill="#F79E1B"/>
      <path d="M40 9.5c3 3.5 4.5 7.5 4.5 10.5s-1.5 7-4.5 10.5c-3-3.5-4.5-7.5-4.5-10.5s1.5-7 4.5-10.5z" fill="#FF5F00"/>
    </svg>
  )
}

export function WizallLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="8" fill="#00A651"/>
      <text x="14" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="16">Wizall</text>
    </svg>
  )
}
