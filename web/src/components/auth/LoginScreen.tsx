import { isMicrosoftAuthConfigured, MICROSOFT_ENTRA_PROVIDER_ID, signIn } from '@/lib/auth'
import type { CSSProperties } from 'react'

type LegalLink = {
  label?: string | null
  url?: string | null
} | null

type LoginScreenProps = {
  headline?: string | null
  subline?: string | null
  ctaLabel?: string | null
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: LegalLink[] | null
}

const fallbackHeadline = 'VERKAUFSPRÄSENTATION'
const fallbackSubline = 'Starte jetzt in dein nächstes Verkaufsgespräch'
const fallbackCtaLabel = 'MIT MICROSOFT ANMELDEN'
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

function MicrosoftGlyph() {
  return (
    <span
      className="grid h-5 w-5 shrink-0 grid-cols-2 gap-[2px] overflow-hidden rounded-[1px]"
      aria-hidden="true"
    >
      <span className="bg-[#3d4248]" />
      <span className="bg-[#3d4248]" />
      <span className="bg-[#3d4248]" />
      <span className="bg-[#3d4248]" />
    </span>
  )
}

function findLegalLink(legalLinks: LegalLink[] | null | undefined, pattern: RegExp, fallbackLabel: string) {
  const match = legalLinks?.find((link) => link?.label && pattern.test(link.label))

  return {
    label: match?.label?.trim() || fallbackLabel,
    url: match?.url?.trim() || undefined,
  }
}

function FooterLink({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return <span>{label}</span>
  }

  return (
    <a href={url} className="transition hover:text-[#efb804]">
      {label}
    </a>
  )
}

export function LoginScreen({
  headline,
  subline,
  ctaLabel,
  logoUrl,
  logoAlt = 'Conversio Energie',
  rightPatternUrl,
  rightPatternAlt = '',
  footerAddress,
  legalLinks,
}: LoginScreenProps) {
  async function startMicrosoftSignIn() {
    'use server'

    if (!isMicrosoftAuthConfigured) {
      return
    }

    await signIn(MICROSOFT_ENTRA_PROVIDER_ID, { redirectTo: '/' })
  }

  const microsoftLoginEnabled = isMicrosoftAuthConfigured
  const resolvedHeadline = (headline?.trim() || fallbackHeadline).toLocaleUpperCase('de-AT')
  const resolvedSubline = subline?.trim() || fallbackSubline
  const resolvedCtaLabel = (ctaLabel?.trim() || fallbackCtaLabel).toLocaleUpperCase('de-AT')
  const resolvedAddress =
    footerAddress?.trim().replace(/\s*\r?\n\s*/g, ', ') || fallbackFooterAddress
  const imprintLink = findLegalLink(legalLinks, /impress/i, 'IMPRESSUM')
  const privacyLink = findLegalLink(
    legalLinks,
    /(datenschutz|privacy)/i,
    'DATENSCHUTZ',
  )
  const logoStyle = logoUrl
    ? ({
      backgroundImage: `url("${logoUrl}")`,
    } as CSSProperties)
    : undefined
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
        {logoUrl ? (
          <span
            aria-label={logoAlt}
            role="img"
            className="login-logo-image block bg-contain bg-left bg-no-repeat"
            style={logoStyle}
          />
        ) : (
          <ConversioLogo />
        )}
      </div>

      <section className="login-main-content absolute z-10 -translate-y-1/2">
        <h1 className="login-title font-barlow font-bold uppercase leading-[0.98] text-[#3d4248]">
          {resolvedHeadline}
        </h1>
        <p className="login-subtitle font-barlow font-normal leading-[1.3] text-[#3d4248]">
          {resolvedSubline}
        </p>
        <form action={startMicrosoftSignIn} className="login-form">
          <button
            type="submit"
            disabled={!microsoftLoginEnabled}
            aria-label="Mit Microsoft anmelden"
            className="login-ms-button font-barlow inline-flex items-center justify-center rounded-full bg-[#efb804] font-semibold uppercase text-[#3d4248] shadow-none transition hover:bg-[#e4ad00] hover:shadow-[0_10px_24px_rgba(239,184,4,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d4248] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#efb804] disabled:hover:shadow-none"
          >
            <MicrosoftGlyph />
            <span>{resolvedCtaLabel}</span>
          </button>
        </form>
      </section>

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
