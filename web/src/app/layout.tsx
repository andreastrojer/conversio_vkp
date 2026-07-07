import type {Metadata} from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
