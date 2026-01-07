import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PerformanceProvider } from '@/components/providers/performance-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import ErrorBoundary from '@/components/error-boundary'
import { Toaster } from 'sonner'

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'RetailPro Analytics Hub',
  description: 'Advanced business intelligence platform for retail product management and analytics',
  keywords: 'retail, analytics, business intelligence, inventory, sales forecasting',
  authors: [{ name: 'RetailPro Development Team' }],
  robots: 'noindex, nofollow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <PerformanceProvider>
              {children}
            </PerformanceProvider>
          </QueryProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  )
}