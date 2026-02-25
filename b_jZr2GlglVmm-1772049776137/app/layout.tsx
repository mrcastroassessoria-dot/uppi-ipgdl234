import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  // themeColor é controlado dinamicamente pelo componente OnboardingCarousel
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Revolut Business',
  description: 'Go beyond business as usual with Revolut Business',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Revolut Business',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* theme-color inicial — será sobrescrito dinamicamente pelo JS */}
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className="font-sans antialiased"
        style={{
          margin: 0,
          padding: 0,
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
