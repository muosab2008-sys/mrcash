import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationProvider } from '@/components/notifications/notification-provider'
import { CookieConsent } from '@/components/cookie-consent'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'MrCash - Earn Rewards & Cash',
  description: 'Earn real cash rewards by completing offers, surveys, and tasks. Join MrCash today!',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MrCash',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'MrCash - Earn Rewards & Cash',
    description: 'Share your link and get paid! The best platform to earn rewards online.',
    url: 'https://mrcash.vercel.app',
    siteName: 'MrCash',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MrCash Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MrCash - Earn Rewards & Cash',
    description: 'Earn real cash rewards by completing tasks.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" className="dark bg-background" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
          <CookieConsent />
          <ServiceWorkerRegistration />
          <Toaster 
            position="top-center" 
            richColors 
            theme="dark"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
            }}
          />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
