import {LogoutButton} from '@/components/auth/LogoutButton'
import {Info} from 'lucide-react'

type AccountMenuProps = {
  userName?: string | null
  userEmail?: string | null
  menuIconUrl?: string | null
  logoutLabel?: string | null
}

const fallbackLogoutLabel = 'Abmelden'

function getDisplaySource(userName?: string | null, userEmail?: string | null) {
  const name = userName?.trim()

  if (name) {
    return name
  }

  const emailName = userEmail?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()

  return emailName || 'Benutzer'
}

export function AccountMenu({
  userName,
  userEmail,
  menuIconUrl,
  logoutLabel,
}: AccountMenuProps) {
  const displayName = getDisplaySource(userName, userEmail)
  const loginIdentity = userEmail || userName || 'Microsoft-Konto'
  const resolvedMenuIcon = menuIconUrl?.trim() || undefined
  const resolvedLogoutLabel = logoutLabel?.trim() || fallbackLogoutLabel

  return (
    <details className="welcome-account-menu font-barlow">
      <summary className="welcome-account-summary" aria-label="Profilmenü öffnen">
        {resolvedMenuIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolvedMenuIcon} alt="" className="welcome-account-menu-icon" />
        ) : (
          <span className="welcome-account-avatar-fallback">
            <Info aria-hidden="true" size={36} strokeWidth={2.1} />
          </span>
        )}
      </summary>

      <div className="welcome-account-popover">
        <p className="welcome-account-kicker">Microsoft-Konto</p>
        <p className="welcome-account-name">{displayName}</p>
        <p className="welcome-account-email">{loginIdentity}</p>

        <LogoutButton
          label={resolvedLogoutLabel}
          className="welcome-account-logout font-barlow inline-flex w-full items-center justify-center rounded-full border border-[#3d4248]/18 bg-white px-5 text-[14px] font-medium text-[#3d4248] transition hover:border-[#3d4248]/35 hover:bg-[#f6f6f6]"
        />
      </div>
    </details>
  )
}
