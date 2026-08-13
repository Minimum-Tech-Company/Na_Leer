import Image from 'next/image'

export function WaveLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src="/images/wave.png"
        alt="Wave"
        width={894}
        height={447}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

export function OrangeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src="/images/orangemoney.png"
        alt="Orange Money"
        width={894}
        height={447}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

export function FreeMoneyLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="140" height="40" rx="8" fill="#E2001A"/>
        <text x="12" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="17" letterSpacing="1">FREE</text>
        <text x="78" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="13">Money</text>
      </svg>
    </div>
  )
}

export function VisaLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        <text x="10" y="28" fill="#1A1F71" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="22" fontStyle="italic">VISA</text>
      </svg>
    </div>
  )
}

export function MastercardLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="80" height="40" rx="8" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        <circle cx="30" cy="20" r="13" fill="#EB001B"/>
        <circle cx="50" cy="20" r="13" fill="#F79E1B"/>
        <path d="M40 9.5c3 3.5 4.5 7.5 4.5 10.5s-1.5 7-4.5 10.5c-3-3.5-4.5-7.5-4.5-10.5s1.5-7 4.5-10.5z" fill="#FF5F00"/>
      </svg>
    </div>
  )
}

export function WizallLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="40" rx="8" fill="#00A651"/>
        <text x="14" y="27" fill="white" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="16">Wizall</text>
      </svg>
    </div>
  )
}
