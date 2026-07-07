import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-950">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-neutral-500">
          Conversio VKP
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Web-App Basis ist vorbereitet.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600">
          Next.js, Tailwind CSS, NextAuth und Sanity Client sind angelegt. Die bestehende
          Sanity-Studio-Struktur im Root bleibt unveraendert.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Login-Seite ansehen
          </Link>
        </div>
      </section>
    </main>
  )
}
