import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const vierkant = localFont({
	src: '/fonts/architype-vierkant.woff2',
	variable: '--font-vierkant',
	display: 'swap',
	weight: '400'
})

export const metadata: Metadata = {
  title: 'Scytro - Self-Mobile Checkout',
  description: 'Self-Mobile Checkout App - Scan • Pay • Go',
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
