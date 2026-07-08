import {LogoutButton} from '@/components/auth/LogoutButton'
import {
  AuthBrandingShell,
  type AuthBrandingLegalLink,
} from '@/components/layout/AuthBrandingShell'
import type {CSSProperties} from 'react'

type WelcomeScreenProps = {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

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

export function WelcomeScreen({
  userName,
  userEmail,
  userImage,
  logoUrl,
  logoAlt,
  rightPatternUrl,
  rightPatternAlt,
  footerAddress,
  legalLinks,
}: WelcomeScreenProps) {
  const firstName = getFirstName(userName, userEmail)
  const initials = getInitials(userName, userEmail)
  const avatarStyle = userImage
    ? ({
        backgroundImage: `url("${userImage}")`,
      } as CSSProperties)
    : undefined

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
          <span>WILLKOMMEN,</span>
          <br />
          <span>{firstName}</span>
        </h1>

        <div className="welcome-profile">
          {userImage ? (
            <span
              aria-label={userName || userEmail || 'Profilbild'}
              role="img"
              className="welcome-avatar welcome-avatar-image"
              style={avatarStyle}
            />
          ) : (
            <span className="welcome-avatar welcome-avatar-fallback" aria-hidden="true">
              {initials}
            </span>
          )}

          <span className="welcome-chevron" aria-hidden="true" />

          {userEmail ? (
            <p className="welcome-email font-barlow">Angemeldet als {userEmail}</p>
          ) : null}

          <LogoutButton
            label="Abmelden"
            className="welcome-logout-button font-barlow inline-flex items-center justify-center rounded-full border border-[#3d4248]/18 bg-white/80 px-5 text-[14px] font-medium text-[#3d4248] transition hover:border-[#3d4248]/35 hover:bg-[#f6f6f6]"
          />
        </div>
      </section>
    </AuthBrandingShell>
  )
}
