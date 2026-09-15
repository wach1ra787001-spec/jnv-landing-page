import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jnvtradingjournal.com'),
  title: 'JnV Trading Journal',
  description: 'A focused trading journal for understanding performance, behavior, and consistency.',
  alternates: {
    canonical: 'https://jnvtradingjournal.com',
  },
  keywords: ['trading journal', 'performance analytics', 'AI trading coach', 'MT5 integration', 'trading psychology'],
  icons: {
    icon: '/jnv-mark.svg',
    shortcut: '/jnv-mark.svg',
    apple: '/jnv-mark.svg',
  },
  openGraph: {
    title: 'JnV Trading Journal',
    description: 'A focused trading journal for understanding performance, behavior, and consistency.',
    url: 'https://jnvtradingjournal.com',
    siteName: 'JnV Trading Journal',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'JnV Trading Journal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JnV Trading Journal',
    description: 'A focused trading journal for understanding performance, behavior, and consistency.',
    images: ['/og-image.svg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=menu" />
      </head>
      <body className="font-sans antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
