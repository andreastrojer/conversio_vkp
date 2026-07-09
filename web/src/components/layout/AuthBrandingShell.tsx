import type {CSSProperties, ReactNode} from 'react'
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

function ConversioLogo() {
  return (
    <div
      className="conversio-logo-fallback flex items-center gap-3 text-[#3d4248]"
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
    ? ({
        '--login-pattern-image': `url("${rightPatternUrl}")`,
      } as CSSProperties & {'--login-pattern-image': string})
    : undefined

  return (
    <main className="login-start-screen relative min-h-screen w-screen overflow-hidden bg-white text-[#3d4248]">
      {rightPatternUrl ? (
        <span
          aria-hidden="true"
          title={rightPatternAlt || undefined}
          className="login-start-pattern pointer-events-none z-0 block bg-contain bg-center bg-no-repeat"
          style={patternStyle}
        />
      ) : (
        <span
          aria-hidden="true"
          className="login-start-pattern login-start-pattern-fallback pointer-events-none z-0"
        />
      )}

      <div className="login-logo absolute z-10">
        <Link href="/" className="login-logo-link" aria-label="Zur Welcome-Seite">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={logoAlt}
              className="login-logo-image"
            />
          ) : (
            <ConversioLogo />
          )}
        </Link>
      </div>

      {children}

      <footer className="login-footer font-barlow absolute z-10 flex items-center font-normal uppercase text-[#3d4248]">
        <FooterLink label={imprintLink.label.toLocaleUpperCase('de-AT')} url={imprintLink.url} />
        <FooterLink label={privacyLink.label.toLocaleUpperCase('de-AT')} url={privacyLink.url} />
        <span aria-hidden="true" className="text-[20px] font-normal leading-none">
          |
        </span>
        <span className="font-bold">{resolvedAddress.toLocaleUpperCase('de-AT')}</span>
      </footer>
    </main>
  )
}
