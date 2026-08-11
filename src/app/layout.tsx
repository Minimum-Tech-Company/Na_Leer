import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NA-Leer - Facturation pour PME Africaines',
  description: 'Creez, envoyez et gerez vos factures en ligne. Paiements Wave, Orange Money et Visa.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
