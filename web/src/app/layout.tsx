import type {Metadata} from 'next'
import {Barlow} from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Conversio VKP',
  description: 'Web-App fuer die Conversio VKP Beratung.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={barlow.variable}>{children}</body>
    </html>
  )
}
