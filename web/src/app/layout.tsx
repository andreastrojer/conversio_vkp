import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const barlow = localFont({
  src: [
    { path: './fonts/Barlow-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Barlow-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Barlow-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Barlow-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Barlow-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './fonts/Barlow-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'conversio_vkp',
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
