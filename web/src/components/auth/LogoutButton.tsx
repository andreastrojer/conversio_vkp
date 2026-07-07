import {signOut} from '@/lib/auth'

export function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({redirectTo: '/login'})
      }}
    >
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
      >
        Logout
      </button>
    </form>
  )
}
