import {AuthBrandingShell, type AuthBrandingLegalLink} from '@/components/layout/AuthBrandingShell'
import { isMicrosoftAuthConfigured, MICROSOFT_ENTRA_PROVIDER_ID, signIn } from '@/lib/auth'

type LoginScreenProps = {
  headline?: string | null
  subline?: string | null
  ctaLabel?: string | null
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

const fallbackHeadline = 'VERKAUFSPRÄSENTATION'
const fallbackSubline = 'Starte jetzt in dein nächstes Verkaufsgespräch'
const fallbackCtaLabel = 'MIT MICROSOFT ANMELDEN'
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

  return (
    <AuthBrandingShell
      logoUrl={logoUrl}
      logoAlt={logoAlt}
      rightPatternUrl={rightPatternUrl}
      rightPatternAlt={rightPatternAlt}
      footerAddress={footerAddress}
      legalLinks={legalLinks}
    >
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
    </AuthBrandingShell>
  )
}
