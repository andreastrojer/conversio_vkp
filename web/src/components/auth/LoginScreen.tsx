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
  'absolute left-[clamp(48px,3.9vw,60px)] top-[42.5%] z-10 max-w-[min(930px,calc(100vw-560px))] -translate-y-1/2 max-[1400px]:max-w-[min(880px,calc(100vw-500px))] [@media_(min-width:1024px)_and_(max-height:950px)]:!left-[clamp(46px,3.6vw,60px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!top-[43.5%] [@media_(min-width:1024px)_and_(max-height:950px)]:!max-w-[min(820px,calc(100vw-660px))]'
const titleClassName =
  'max-w-[930px] font-sans text-[clamp(60px,4.7vw,72px)] font-bold uppercase leading-[0.98] tracking-[0.03em] text-[#3d4248] max-[1400px]:text-[62px] max-[1400px]:tracking-[0.025em] [@media_(min-width:1024px)_and_(max-height:950px)]:!text-[clamp(52px,3.45vw,60px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!tracking-[0.024em]'
const subtitleClassName =
  'mt-[clamp(24px,2vw,32px)] max-w-[760px] font-sans text-[clamp(24px,1.82vw,28px)] font-normal leading-[1.3] tracking-[0.005em] text-[#3d4248] max-[1400px]:mt-6 max-[1400px]:text-[24px] [@media_(min-width:1024px)_and_(max-height:950px)]:!mt-[22px] [@media_(min-width:1024px)_and_(max-height:950px)]:!text-[clamp(21px,1.45vw,24px)]'
const formClassName =
  'mt-[clamp(24px,1.9vw,28px)] max-[1400px]:mt-6 [@media_(min-width:1024px)_and_(max-height:950px)]:!mt-[22px]'
const microsoftButtonClassName =
  'inline-flex h-[clamp(44px,3vw,46px)] items-center justify-center gap-[clamp(12px,1vw,16px)] rounded-full bg-[#efb804] px-[clamp(26px,2.1vw,32px)] font-sans text-[clamp(18px,1.3vw,20px)] font-semibold uppercase tracking-[0.035em] text-[#3d4248] shadow-none transition hover:bg-[#e4ad00] hover:shadow-[0_10px_24px_rgba(239,184,4,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d4248] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#efb804] disabled:hover:shadow-none max-[1400px]:h-11 max-[1400px]:px-7 max-[1400px]:text-[18px] [@media_(min-width:1024px)_and_(max-height:950px)]:!h-[42px] [@media_(min-width:1024px)_and_(max-height:950px)]:!gap-3 [@media_(min-width:1024px)_and_(max-height:950px)]:!px-[26px] [@media_(min-width:1024px)_and_(max-height:950px)]:!text-[16px]'

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
