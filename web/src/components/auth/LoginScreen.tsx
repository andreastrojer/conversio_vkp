'use client'

import {motion} from 'framer-motion'
import {LogIn} from 'lucide-react'

export function LoginScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <motion.section
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.25, ease: 'easeOut'}}
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-neutral-900 text-white">
          <LogIn aria-hidden="true" className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Login</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Die Authentifizierung ist vorbereitet. Der Microsoft-Entra-ID-Provider wird im
          naechsten Schritt angeschlossen.
        </p>
      </motion.section>
    </main>
  )
}
