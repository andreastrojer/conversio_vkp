import {AccountMenu} from '@/components/auth/AccountMenu'
import {
  AuthBrandingShell,
  type AuthBrandingLegalLink,
} from '@/components/layout/AuthBrandingShell'
import Link from 'next/link'

type WelcomeScreenProps = {
  userName?: string | null
  userEmail?: string | null
  headline?: string | null
  subline?: string | null
  ctaLabel?: string | null
  ctaTarget?: string | null
  logoutLabel?: string | null
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  informationIconUrl?: string
  profileFallbackUrl?: string
  accountMenuPatternUrl?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

const fallbackHeadline = 'WILLKOMMEN,'
const fallbackCtaLabel = 'Kundengruppe auswählen'
const fallbackCtaTarget = '/customer-selection'
const fallbackLogoutLabel = 'Abmelden'
const mainContentClassName =
  'absolute left-[60px] top-[47%] z-10 max-w-[520px] -translate-y-1/2'
const titleClassName =
  'font-sans text-[50px] font-bold uppercase leading-[1.02] tracking-[0.024em] text-[#3d4248]'
const actionAreaClassName =
  'mt-[30px] block max-w-[380px] font-sans'
const sublineClassName =
  'm-0 max-w-[390px] font-sans text-[19px] font-normal leading-[1.28] tracking-[0.006em] text-[#3d4248] max-[1600px]:max-w-[440px] max-[1600px]:text-[24px] [@media(max-height:920px)]:max-w-[440px] [@media(max-height:920px)]:text-[24px]'
const nextButtonClassName =
  'inline-flex h-10 min-w-[292px] items-center justify-between gap-[18px] rounded-full bg-[#efb804] px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-[#3d4248] transition-[background-color,box-shadow] duration-[160ms] ease-[ease] hover:bg-[#e4ad00] hover:shadow-[0_10px_24px_rgba(239,184,4,0.22)] max-[1600px]:h-[48px] max-[1600px]:min-w-[340px] max-[1600px]:px-7 max-[1600px]:text-[16px] [@media(max-height:920px)]:h-[48px] [@media(max-height:920px)]:min-w-[340px] [@media(max-height:920px)]:px-7 [@media(max-height:920px)]:text-[16px]'
const compactFooterClassName =
  'max-[1600px]:gap-[26px] max-[1600px]:text-[16px] [@media(max-height:920px)]:gap-[26px] [@media(max-height:920px)]:text-[16px]'

function getDisplaySource(userName?: string | null, userEmail?: string | null) {
  const name = userName?.trim()

  if (name) {
    return name
  }

  const emailName = userEmail?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()

  return emailName || 'Benutzer'
}

function getFirstName(userName?: string | null, userEmail?: string | null) {
  const source = getDisplaySource(userName, userEmail)
  const [firstName] = source.split(/\s+/)

  return (firstName || 'Benutzer').toLocaleUpperCase('de-AT')
}

function resolveWelcomeHeadline(headline: string | null | undefined, firstName: string) {
  const rawHeadline = headline?.trim() || fallbackHeadline
  const withName = rawHeadline
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\s*firstName\s*\}/gi, firstName)

  if (withName !== rawHeadline) {
    return withName.toLocaleUpperCase('de-AT').split(/\r?\n/)
  }

  const normalizedHeadline = withName.toLocaleUpperCase('de-AT')

  return [normalizedHeadline, firstName]
}

function resolveTargetHref(target: string | null | undefined) {
  const cleanTarget = target?.trim()

  if (!cleanTarget || cleanTarget === 'next') {
    return fallbackCtaTarget
  }

  if (
    cleanTarget === 'intro' ||
    cleanTarget === '/intro' ||
    cleanTarget === 'kundengruppe' ||
    cleanTarget === 'customerSelection' ||
    cleanTarget === 'customer-selection'
  ) {
    return fallbackCtaTarget
  }

  if (
    cleanTarget.startsWith('/') ||
    cleanTarget.startsWith('#') ||
    cleanTarget.startsWith('http://') ||
    cleanTarget.startsWith('https://')
  ) {
    return cleanTarget
  }

  return `/${cleanTarget.replace(/^\/+/, '')}`
}

export function WelcomeScreen({
  userName,
  userEmail,
  headline,
  subline,
  ctaLabel,
  ctaTarget,
  logoutLabel,
  logoUrl,
  logoAlt,
  rightPatternUrl,
  rightPatternAlt,
  informationIconUrl,
  profileFallbackUrl,
  accountMenuPatternUrl,
  footerAddress,
  legalLinks,
}: WelcomeScreenProps) {
  const firstName = getFirstName(userName, userEmail)
  const headlineLines = resolveWelcomeHeadline(headline, firstName)
  const resolvedSubline = subline?.trim()
  const resolvedCtaLabel = ctaLabel?.trim() || fallbackCtaLabel
  const resolvedLogoutLabel = logoutLabel?.trim() || fallbackLogoutLabel
  const ctaHref = resolveTargetHref(ctaTarget)

  return (
    <AuthBrandingShell
      logoUrl={logoUrl}
      logoAlt={logoAlt}
      rightPatternUrl={rightPatternUrl}
      rightPatternAlt={rightPatternAlt}
      footerAddress={footerAddress}
      legalLinks={legalLinks}
      footerClassName={compactFooterClassName}
    >
      <AccountMenu
        userName={userName}
        userEmail={userEmail}
        menuIconUrl={profileFallbackUrl || informationIconUrl}
        patternUrl={accountMenuPatternUrl}
        logoutLabel={resolvedLogoutLabel}
        enlargeOnCompactViewport
      />

      <section className={mainContentClassName}>
        <h1 className={titleClassName}>
          {headlineLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>

        <div className={actionAreaClassName}>
          <div className="flex min-h-0 flex-col items-start justify-center gap-[22px] border-l-0 pl-0">
            {resolvedSubline ? (
              <p className={sublineClassName}>
                {resolvedSubline}
              </p>
            ) : null}
            <Link href={ctaHref} className={nextButtonClassName}>
              <span>{resolvedCtaLabel}</span>
              <span className="relative block h-3 w-7 shrink-0 max-[1600px]:w-8 [@media(max-height:920px)]:w-8" aria-hidden="true">
                <span className="pointer-events-none absolute left-0 top-1/2 h-0.5 w-[27px] bg-current [transform:translateY(-50%)]" />
                <span className="pointer-events-none absolute right-0 top-1/2 h-2 w-2 border-r-2 border-t-2 border-current [transform:translateY(-50%)_rotate(45deg)]" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </AuthBrandingShell>
  )
}
