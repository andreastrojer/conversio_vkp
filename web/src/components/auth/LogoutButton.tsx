import {getMicrosoftLogoutUrl, signOut} from '@/lib/auth'
import {headers} from 'next/headers'
import {redirect} from 'next/navigation'

async function getPostLogoutRedirectUri() {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const protocol =
    requestHeaders.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')

  if (!host) {
    return new URL('/login', process.env.AUTH_URL || 'http://localhost:3000').toString()
  }

  return new URL('/login', `${protocol}://${host}`).toString()
}

type LogoutButtonProps = {
  label?: string
  className?: string
}

export function LogoutButton({label = 'Logout', className}: LogoutButtonProps) {
  return (
    <form
      action={async () => {
        'use server'

        const postLogoutRedirectUri = await getPostLogoutRedirectUri()
        const microsoftLogoutUrl = getMicrosoftLogoutUrl(postLogoutRedirectUri)

        await signOut({redirect: false})
        redirect(microsoftLogoutUrl || '/login')
      }}
    >
      <button
        type="submit"
        className={
          className ||
          'inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100'
        }
      >
        {label}
      </button>
    </form>
  )
}
