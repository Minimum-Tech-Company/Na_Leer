import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NA-Leer - Facturation en ligne pour PME Africaines | Naleer',
  description: 'NA-Leer (Naleer) est la plateforme de facturation en ligne pour les PME d\'Afrique de l\'Ouest. Créez des factures professionnelles, encaissez par Wave, Orange Money, Free Money et carte bancaire. Gratuit pour commencer.',
  keywords: [
    'NA-Leer', 'Naleer', 'facturation', 'facture en ligne', 'facturation Sénégal',
    'facturation Afrique', 'facturation PME', 'facture Wave', 'facture Orange Money',
    'facturation Ouest africaine', 'logiciel facturation', 'devis en ligne',
    'paiement Wave', 'paiement Orange Money', 'facturation Dakar', 'SaaS facturation',
  ],
  authors: [{ name: 'Minimum Tech Company' }],
  creator: 'Minimum Tech Company',
  publisher: 'Minimum Tech Company',
  metadataBase: new URL('https://na-leer.org'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://na-leer.org',
    siteName: 'NA-Leer',
    title: 'NA-Leer - Facturation en ligne pour PME Africaines',
    description: 'Créez, envoyez et gérez vos factures en ligne. Paiements Wave, Orange Money, Free Money et carte bancaire. Gratuit pour commencer.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NA-Leer - Facturation en ligne pour PME Africaines',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NA-Leer - Facturation en ligne pour PME Africaines',
    description: 'Créez, envoyez et gérez vos factures en ligne. Paiements Wave, Orange Money, Free Money et carte bancaire.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://na-leer.org',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Applique le thème avant le premier rendu pour éviter le flash blanc */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nl_theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'NA-Leer',
              alternateName: 'Naleer',
              description: 'Plateforme de facturation en ligne pour les PME d\'Afrique de l\'Ouest. Créez des factures professionnelles et encaissez par Wave, Orange Money, Free Money et carte bancaire.',
              url: 'https://na-leer.org',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'XOF',
                description: 'Plan gratuit disponible',
              },
              author: {
                '@type': 'Organization',
                name: 'Minimum Tech Company',
              },
              inLanguage: 'fr',
              availableLanguage: ['fr'],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
