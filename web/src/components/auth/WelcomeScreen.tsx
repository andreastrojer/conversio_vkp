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
  profileChevronUrl?: string
  profileFallbackUrl?: string
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
  profileChevronUrl,
  profileFallbackUrl,
  footerAddress,
  legalLinks,
}: WelcomeScreenProps) {
  const firstName = getFirstName(userName, userEmail)
  const resolvedUserImage = userImage?.trim() || undefined
  const resolvedProfileFallbackUrl = profileFallbackUrl?.trim() || undefined
  const hasUserImage = Boolean(resolvedUserImage)
  const headlineLines = resolveWelcomeHeadline(headline, firstName)
  const resolvedSubline = subline?.trim()
  const resolvedCtaLabel = ctaLabel?.trim() || fallbackCtaLabel
  const resolvedLogoutLabel = logoutLabel?.trim() || fallbackLogoutLabel
  const loginIdentity = userEmail || userName || 'Microsoft-Konto'
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

        <div className="welcome-profile-row">
          <div className="welcome-profile-panel" aria-label={userName || userEmail || 'Profil'}>
            <div className="welcome-profile-figure" aria-label={userName || userEmail || 'Profil'}>
              {hasUserImage ? (
                <>
                  <div className="welcome-portrait-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolvedUserImage}
                      alt={userName || userEmail || 'Microsoft Profilbild'}
                      className="welcome-portrait-image"
                    />
                  </div>
                  <span className="welcome-profile-chevron" aria-hidden="true">
                    {profileChevronUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileChevronUrl}
                        alt=""
                        className="welcome-profile-chevron-image"
                      />
                    ) : (
                      <span className="welcome-profile-chevron-fallback" />
                    )}
                  </span>
                </>
              ) : resolvedProfileFallbackUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedProfileFallbackUrl}
                  alt=""
                  className="welcome-profile-fallback-image"
                  aria-hidden="true"
                />
              ) : null}
            </div>

            <div className="welcome-session-panel font-barlow">
              <p className="welcome-session-label">Sie sind eingeloggt mit</p>
              <p className="welcome-email">{loginIdentity}</p>

              <LogoutButton
                label={resolvedLogoutLabel}
                className="welcome-logout-button font-barlow inline-flex items-center justify-center rounded-full border border-[#3d4248]/18 bg-white px-5 text-[14px] font-medium text-[#3d4248] transition hover:border-[#3d4248]/35 hover:bg-[#f6f6f6]"
              />
            </div>
          </div>
        </div>

        {resolvedSubline ? (
          <p className="welcome-subline font-barlow font-normal text-[#3d4248]">
            {resolvedSubline}
          </p>
        ) : null}

        <div className="welcome-step-row font-barlow">
          <div className="welcome-selection-panel">
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
