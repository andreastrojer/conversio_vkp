import type {ReactNode} from 'react'
import {brandLogoImageClassName, brandLogoPositionClassName} from '@/lib/brandingLayout'
import {PresentationViewport} from '@/components/layout/PresentationViewport'
import Link from 'next/link'

export type AuthBrandingLegalLink = {
  label?: string | null
  url?: string | null
} | null

type AuthBrandingShellProps = {
  children: ReactNode
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

const fallbackFooterAddress = 'KOSCHATSTRASSE 24, 9800 SPITTAL/DRAU'

const screenClassName =
  'relative isolate h-full w-full overflow-hidden bg-white text-[#3d4248]'
const patternFrameClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 block h-[850px] w-[850px]'
const patternImageClassName =
  `${patternFrameClassName} bg-contain bg-center bg-no-repeat opacity-[0.86] mix-blend-normal [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]`
const patternFallbackClassName = `${patternFrameClassName} opacity-[0.08] [transform:rotate(30deg)]`
const footerClassName =
  'absolute bottom-[30px] left-[60px] z-10 flex items-center gap-[22px] font-sans text-[14px] font-normal uppercase tracking-[0.02em] text-[#3d4248]'

function ConversioLogo() {
  return (
    <div
      className="flex items-center gap-3 font-[Arial,Helvetica,sans-serif] text-[#3d4248]"
      aria-label="Conversio Energie"
    >
      <div className="relative grid h-10 w-10 place-items-center text-[#efb804]">
        <span className="absolute h-9 w-9 rotate-45 rounded-[6px] border-2 border-current opacity-90" />
        <span className="absolute h-6 w-6 rotate-45 rounded-[4px] border-2 border-current opacity-80" />
        <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-current" />
      </div>
      <div className="leading-none">
        <p className="text-[22px] font-bold uppercase tracking-[0.07em]">Conversio</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em]">Energie</p>
      </div>
    </div>
  )
}

function findLegalLink(
  legalLinks: AuthBrandingLegalLink[] | null | undefined,
  pattern: RegExp,
  fallbackLabel: string,
) {
  const match = legalLinks?.find((link) => link?.label && pattern.test(link.label))

  return {
    label: match?.label?.trim() || fallbackLabel,
    url: match?.url?.trim() || undefined,
  }
}

function FooterLink({label, url}: {label: string; url?: string}) {
  if (!url) {
    return <span>{label}</span>
  }

  return (
    <a href={url} className="transition hover:text-[#efb804]">
      {label}
    </a>
  )
}

export function AuthBrandingShell({
  children,
  logoUrl,
  logoAlt = 'Conversio Energie',
  rightPatternUrl,
  rightPatternAlt = '',
  footerAddress,
  legalLinks,
}: AuthBrandingShellProps) {
  const resolvedAddress =
    footerAddress?.trim().replace(/\s*\r?\n\s*/g, ', ') || fallbackFooterAddress
  const imprintLink = findLegalLink(legalLinks, /impress/i, 'IMPRESSUM')
  const privacyLink = findLegalLink(legalLinks, /(datenschutz|privacy)/i, 'DATENSCHUTZ')
  const patternStyle = rightPatternUrl
    ? {backgroundImage: `url("${rightPatternUrl}")`}
    : undefined

  return (
    <PresentationViewport backgroundClassName="bg-white">
      <main className={screenClassName}>
        {rightPatternUrl ? (
          <span
            aria-hidden="true"
            title={rightPatternAlt || undefined}
            className={patternImageClassName}
            style={patternStyle}
          />
        ) : (
          <span
            aria-hidden="true"
            className={patternFallbackClassName}
          >
            <span className="absolute inset-[84px] border-[58px] border-solid border-[#3d4248] [clip-path:polygon(50%_0,92%_25%,92%_75%,50%_100%,8%_75%,8%_25%)]" />
            <span className="absolute bottom-[18px] left-[30px] right-[30px] h-[58px] bg-[#3d4248] [box-shadow:-84px_-184px_0_#3d4248,122px_-332px_0_#3d4248,-22px_-514px_0_#3d4248] [transform:skewY(-31deg)]" />
          </span>
        )}

        <div className={brandLogoPositionClassName}>
          <Link href="/" className="block w-max cursor-pointer" aria-label="Zur Welcome-Seite">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={logoAlt}
                className={brandLogoImageClassName}
              />
            ) : (
              <ConversioLogo />
            )}
          </Link>
        </div>

        {children}

        <footer className={footerClassName}>
          <FooterLink label={imprintLink.label.toLocaleUpperCase('de-AT')} url={imprintLink.url} />
          <FooterLink label={privacyLink.label.toLocaleUpperCase('de-AT')} url={privacyLink.url} />
          <span aria-hidden="true" className="text-[20px] font-normal leading-none">
            |
          </span>
          <span className="font-bold">{resolvedAddress.toLocaleUpperCase('de-AT')}</span>
        </footer>
      </main>
    </PresentationViewport>
  )
}
