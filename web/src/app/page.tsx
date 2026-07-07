import {LogoutButton} from '@/components/auth/LogoutButton'
import {auth} from '@/lib/auth'
import {redirect} from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const email = session.user.email || session.user.name || 'Unbekannt'

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-neutral-500">
            Conversio VKP
          </p>
          <LogoutButton />
        </div>

        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Conversio Beratungs-App
          </h1>
          <p className="mt-5 text-base leading-7 text-neutral-600">
            Angemeldet als: {email}
          </p>
          <div className="mt-8">
            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-900 px-5 text-sm font-medium text-white opacity-70"
              title="Der Beratungsflow wird spaeter angeschlossen."
            >
              Zur Beratung
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
