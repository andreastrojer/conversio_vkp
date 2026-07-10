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
        <span className="welcome-account-icon-wrap" aria-hidden="true">
          {resolvedMenuIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolvedMenuIcon} alt="" className="welcome-account-menu-icon" />
          ) : (
            <span className="welcome-account-avatar-fallback">
              <Info aria-hidden="true" size={25} strokeWidth={2.1} />
            </span>
          )}
        </span>
        <span className="welcome-account-summary-text">
          <span>Profil</span>
          <strong>Konto</strong>
        </span>
      </summary>

      <div className="welcome-account-popover">
        <div className="welcome-account-popover-head">
          <span className="welcome-account-popover-icon" aria-hidden="true">
            {resolvedMenuIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvedMenuIcon} alt="" />
            ) : (
              <Info aria-hidden="true" size={22} strokeWidth={2.1} />
            )}
          </span>
          <div>
            <p className="welcome-account-kicker">Microsoft-Konto</p>
            <p className="welcome-account-name">{displayName}</p>
          </div>
        </div>

        <div className="welcome-account-identity">
          <span>Angemeldet als</span>
          <p>{loginIdentity}</p>
        </div>

        <LogoutButton
          label={resolvedLogoutLabel}
          className="welcome-account-logout font-barlow inline-flex w-full items-center justify-center rounded-full px-5 text-[14px] text-[#3d4248] transition"
        />
      </div>
    </details>
  )
}
