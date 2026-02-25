import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { ClientProviders } from '@/components/client-providers'
import { AppInitializer } from '@/components/app-initializer'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Uppi - Viagens com Preco Justo',
  description: 'Negocie o preco da sua corrida diretamente com motoristas. Transparencia e economia em cada viagem.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Uppi',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'application-name': 'Uppi',
    'apple-mobile-web-app-title': 'Uppi',
    'msapplication-TileColor': '#FF6B00',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased overflow-hidden h-dvh">
        <ClientProviders>
          <AppInitializer />
          {children}
          <Analytics />
        </ClientProviders>
      </body>
    </html>
  )
}
