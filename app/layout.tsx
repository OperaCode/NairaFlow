import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import ToastProvider from '@/components/toast-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'NairaFlow - Smart Savings & Remittance',
  description: 'Receive Naira. Save stablecoins automatically. Protect your money from inflation with NairaFlow and the power of Monad.',
  // generator: 'v0.app',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <ToastProvider />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
