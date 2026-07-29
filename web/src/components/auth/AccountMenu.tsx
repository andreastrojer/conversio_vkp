import {AccountMenuClient} from '@/components/auth/AccountMenuClient'
import {LogoutButton} from '@/components/auth/LogoutButton'
import {LogOut} from 'lucide-react'

type AccountMenuProps = {
  userName?: string | null
  userEmail?: string | null
  menuIconUrl?: string | null
  patternUrl?: string | null
  logoutLabel?: string | null
  enlargeOnCompactViewport?: boolean
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
  patternUrl,
  logoutLabel,
  enlargeOnCompactViewport = false,
}: AccountMenuProps) {
  const displayName = getDisplaySource(userName, userEmail)
  const loginIdentity = userEmail || userName || 'Microsoft-Konto'
  const resolvedMenuIcon = menuIconUrl?.trim() || undefined
  const resolvedPatternUrl = patternUrl?.trim() || undefined
  const resolvedLogoutLabel = logoutLabel?.trim() || fallbackLogoutLabel

  return (
    <AccountMenuClient
      displayName={displayName}
      loginIdentity={loginIdentity}
      menuIconUrl={resolvedMenuIcon}
      patternUrl={resolvedPatternUrl}
      enlargeOnCompactViewport={enlargeOnCompactViewport}
      logoutControl={
        <LogoutButton
          label={resolvedLogoutLabel}
          className="inline-flex h-9 w-full items-center justify-between gap-3 rounded-full border border-[#d9dcdf] bg-white px-4 font-sans text-[13px] font-medium tracking-[0.01em] text-[#2a2e33] transition hover:border-[#efb804] hover:bg-[#fff8df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a2e33] [@media(min-width:768px)_and_(max-width:1366px)]:h-[44px] [@media(min-width:768px)_and_(max-width:1366px)]:px-[20px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[15px]"
          icon={<LogOut aria-hidden="true" size={16} strokeWidth={1.9} />}
        />
      }
    />
  )
}
