import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Knapsack Expirement',
  description: 'Expirementation using Knapsack Problem',
}

// Combine both font classNames
const fontClassNames = `${GeistSans.className} ${GeistMono.variable}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontClassNames}>
      <body>{children}</body>
    </html>
  )
}
