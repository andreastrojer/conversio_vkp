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
const mainContentClassName =
  'absolute left-[60px] top-[43.5%] z-10 max-w-[820px] -translate-y-1/2'
const titleClassName =
  'max-w-[820px] font-sans text-[60px] font-bold uppercase leading-[0.98] tracking-[0.024em] text-[#3d4248]'
const subtitleClassName =
  'mt-[22px] max-w-[760px] font-sans text-[24px] font-normal leading-[1.3] tracking-[0.005em] text-[#3d4248]'
const formClassName =
  'mt-[22px]'
const microsoftButtonClassName =
  'inline-flex h-[42px] items-center justify-center gap-3 rounded-full bg-[#efb804] px-[26px] font-sans text-[16px] font-semibold uppercase tracking-[0.035em] text-[#3d4248] shadow-none transition hover:bg-[#e4ad00] hover:shadow-[0_10px_24px_rgba(239,184,4,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d4248] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#efb804] disabled:hover:shadow-none'

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
      <section className={mainContentClassName}>
        <h1 className={titleClassName}>
          {resolvedHeadline}
        </h1>
        <p className={subtitleClassName}>
          {resolvedSubline}
        </p>
        <form action={startMicrosoftSignIn} className={formClassName}>
          <button
            type="submit"
            disabled={!microsoftLoginEnabled}
            aria-label="Mit Microsoft anmelden"
            className={microsoftButtonClassName}
          >
            <MicrosoftGlyph />
            <span>{resolvedCtaLabel}</span>
          </button>
        </form>
      </section>
    </AuthBrandingShell>
  )
}
