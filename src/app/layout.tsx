import 'src/styles/global.css';
import { ThemeProvider } from 'src/components/providers/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import PWAUpdateManager from 'src/components/pwa-update-manager';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: {
    default: 'Alamo',
    template: '%s | Alamo'
  },
  description:
    'Alamo is the operating system for the American Housing Corporation.',
  keywords: [
    'manufacturing',
    'operations',
    'American Housing Corporation',
    'production management'
  ],
  authors: [{ name: 'American Housing Corporation' }],
  creator: 'American Housing Corporation',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://alamo.americanhousing.co'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Alamo',
    description:
      'Alamo is the operating system for the American Housing Corporation.',
    siteName: 'Alamo',
    images: [
      {
        url: '/images/ahc-logo.png',
        width: 1200,
        height: 630,
        alt: 'Alamo - American Housing Corporation Operating System'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alamo',
    description:
      'Alamo is the operating system for the American Housing Corporation.',
    images: ['/images/ahc-logo.png']
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/alamo_logo.png'
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  other: {
    // iOS PWA meta tags
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Alamo',
    'format-detection': 'telephone=no'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Alamo" />

        <meta name="format-detection" content="telephone=no" />

        {/* Apple Touch Icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/images/alamo_logo.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/images/alamo_logo.png"
        />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PWAUpdateManager />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  );
}
