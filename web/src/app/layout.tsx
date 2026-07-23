import type { Metadata } from 'next'
import localFont from 'next/font/local'
import {
  buildLogoUrl,
  type SiteSettingsDocument,
} from '@/lib/authBranding'
import {SITE_SETTINGS_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'
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

const defaultMetadata: Metadata = {
  title: 'Conversio Energie Web-App',
  description: 'Web-App fuer die Conversio VKP Beratung.',
}

const metadataClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteSettings = await metadataClient.fetch<SiteSettingsDocument>(
      SITE_SETTINGS_QUERY,
      {},
      freshFetchOptions,
    )
    const faviconUrl = buildLogoUrl(siteSettings?.favicon)

    return {
      ...defaultMetadata,
      title: siteSettings?.title?.trim() || defaultMetadata.title,
      ...(faviconUrl
        ? {
            icons: {
              icon: [{url: faviconUrl}],
              shortcut: [{url: faviconUrl}],
            },
          }
        : {}),
    }
  } catch {
    return defaultMetadata
  }
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
