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
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

const fallbackHeadline = 'WILLKOMMEN,'
const fallbackCtaLabel = 'Kundengruppe auswählen'
const fallbackCtaTarget = '/customer-selection'
const fallbackLogoutLabel = 'Abmelden'

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
    >
      <AccountMenu
        userName={userName}
        userEmail={userEmail}
        menuIconUrl={informationIconUrl}
        logoutLabel={resolvedLogoutLabel}
      />

      <section className="welcome-main-content absolute z-10 -translate-y-1/2">
        <h1 className="welcome-title font-barlow font-bold uppercase leading-[1.02] text-[#3d4248]">
          {headlineLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>

        <div className="welcome-action-area font-barlow">
          <div className="welcome-start-panel">
            {resolvedSubline ? (
              <p className="welcome-subline font-barlow font-normal text-[#3d4248]">
                {resolvedSubline}
              </p>
            ) : null}
            <Link href={ctaHref} className="welcome-next-button">
              <span>{resolvedCtaLabel}</span>
              <span className="welcome-next-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </AuthBrandingShell>
  )
}
