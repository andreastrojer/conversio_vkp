import {AccountMenuClient} from '@/components/auth/AccountMenuClient'
import styles from '@/components/auth/AccountMenu.module.css'
import {LogoutButton} from '@/components/auth/LogoutButton'
import {LogOut} from 'lucide-react'

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
    <AccountMenuClient
      displayName={displayName}
      loginIdentity={loginIdentity}
      menuIconUrl={resolvedMenuIcon}
      logoutControl={
        <LogoutButton
          label={resolvedLogoutLabel}
          className={styles.logoutButton}
          icon={<LogOut aria-hidden="true" size={16} strokeWidth={1.9} />}
        />
      }
    />
  )
}
