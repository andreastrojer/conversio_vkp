import {LogoutButton} from '@/components/auth/LogoutButton'
import {
  AuthBrandingShell,
  type AuthBrandingLegalLink,
} from '@/components/layout/AuthBrandingShell'
import Link from 'next/link'

type WelcomeScreenProps = {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  headline?: string | null
  subline?: string | null
  ctaLabel?: string | null
  ctaTarget?: string | null
  logoutLabel?: string | null
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

const fallbackHeadline = 'WILLKOMMEN,'
const fallbackCtaLabel = 'Weiter'
const fallbackCtaTarget = '/beratung'
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

function getInitials(userName?: string | null, userEmail?: string | null) {
  const source = getDisplaySource(userName, userEmail)
  const parts = source.split(/\s+/).filter(Boolean)
  const firstInitial = parts[0]?.charAt(0) || 'B'
  const secondInitial = parts[1]?.charAt(0) || parts[0]?.charAt(1) || ''

  return `${firstInitial}${secondInitial}`.toLocaleUpperCase('de-AT')
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
  userImage,
  headline,
  subline,
  ctaLabel,
  ctaTarget,
  logoutLabel,
  logoUrl,
  logoAlt,
  rightPatternUrl,
  rightPatternAlt,
  footerAddress,
  legalLinks,
}: WelcomeScreenProps) {
  const firstName = getFirstName(userName, userEmail)
  const initials = getInitials(userName, userEmail)
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
      <section className="welcome-main-content absolute z-10 -translate-y-1/2">
        <h1 className="welcome-title font-barlow font-bold uppercase leading-[1.02] text-[#3d4248]">
          {headlineLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>

        {resolvedSubline ? (
          <p className="welcome-subline font-barlow font-normal text-[#3d4248]">
            {resolvedSubline}
          </p>
        ) : null}

        <div className="welcome-lower-row">
          <div className="welcome-profile-figure" aria-label={userName || userEmail || 'Profil'}>
            <div className="welcome-portrait-frame">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={userName || userEmail || 'Microsoft Profilbild'}
                  className="welcome-portrait-image"
                />
              ) : (
                <span className="welcome-portrait-fallback" aria-hidden="true">
                  {initials}
                </span>
              )}
            </div>
            <span className="welcome-profile-chevron" aria-hidden="true" />
          </div>

          <div className="welcome-actions font-barlow">
            <Link href={ctaHref} className="welcome-next-button">
              {resolvedCtaLabel}
            </Link>

            <div className="welcome-logout-area">
              {userEmail ? (
                <p className="welcome-email">Angemeldet als {userEmail}</p>
              ) : null}

              <LogoutButton
                label={resolvedLogoutLabel}
                className="welcome-logout-button font-barlow inline-flex items-center justify-center rounded-full border border-[#3d4248]/18 bg-white px-5 text-[14px] font-medium text-[#3d4248] transition hover:border-[#3d4248]/35 hover:bg-[#f6f6f6]"
              />
            </div>
          </div>
        </div>
      </section>
    </AuthBrandingShell>
  )
}
