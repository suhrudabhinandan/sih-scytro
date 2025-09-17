import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const vierkant = localFont({
	src: [
		{ path: './fonts/CoralPixels-Regular.ttf', weight: '400', style: 'normal' },
	],
	variable: '--font-vierkant',
	display: 'swap'
})

export const metadata: Metadata = {
  title: 'Scytro - Self-Mobile Checkout',
  description: 'Self-Mobile Checkout App - Scan • Pay • Go',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${vierkant.variable}`}>
        <div className="max-w-md mx-auto bg-white min-h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
