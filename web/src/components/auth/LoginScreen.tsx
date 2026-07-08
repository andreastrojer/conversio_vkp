import { isMicrosoftAuthConfigured, MICROSOFT_ENTRA_PROVIDER_ID, signIn } from '@/lib/auth'
import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'

type LoginSection = {
  _key?: string
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  sortOrder?: number | null
} | null

type LoginScreenProps = {
  authError?: string
  headline?: string | null
  subline?: string | null
  ctaLabel?: string | null
  heroImageUrl?: string
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  sections?: LoginSection[] | null
}

const fallbackHeadline = 'Der Weg zur intelligenten Energieberatung'

function splitHeadline(headline: string) {
  const marker = 'Energieberatung'
  const markerIndex = headline.indexOf(marker)

  if (markerIndex >= 0) {
    return {
      main: headline.slice(0, markerIndex).trim(),
      accent: headline.slice(markerIndex).trim(),
    }
  }

  const parts = headline.trim().split(/\s+/)

  return {
    main: parts.slice(0, -1).join(' ') || headline,
    accent: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}

function ConversioLogo() {
  return (
    <div className="flex items-center gap-3 text-neutral-800" aria-label="Conversio Energie">
      <div className="relative grid h-11 w-11 place-items-center">
        <span className="absolute h-9 w-9 rotate-45 rounded-[6px] border-2 border-current opacity-90" />
        <span className="absolute h-6 w-6 rotate-45 rounded-[4px] border-2 border-current opacity-80" />
        <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-current" />
      </div>
      <div className="leading-none">
        <p className="text-[22px] font-bold uppercase tracking-[0.08em]">Conversio</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em]">Energie</p>
      </div>
    </div>
  )
}

function MicrosoftMark() {
  return (
    <span className="grid h-8 w-8 grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </span>
  )
}

export function LoginScreen({
  authError,
  headline,
  heroImageUrl,
  logoUrl,
  logoAlt = 'Conversio Energie',
  rightPatternUrl,
  rightPatternAlt = '',
}: LoginScreenProps) {
  async function startMicrosoftSignIn() {
    'use server'

    if (!isMicrosoftAuthConfigured) {
      return
    }

    await signIn(MICROSOFT_ENTRA_PROVIDER_ID, { redirectTo: '/' })
  }

  const microsoftLoginEnabled = isMicrosoftAuthConfigured
  const resolvedHeadline = headline?.trim() || fallbackHeadline
  const headlineParts = splitHeadline(resolvedHeadline)

  const heroStyle = heroImageUrl
    ? ({
      '--login-hero-image': `url("${heroImageUrl}")`,
    } as CSSProperties)
    : undefined
  const logoStyle = logoUrl
    ? ({
      backgroundImage: `url("${logoUrl}")`,
    } as CSSProperties)
    : undefined
  const patternStyle = rightPatternUrl
    ? ({
      backgroundImage: `url("${rightPatternUrl}")`,
    } as CSSProperties)
    : undefined

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 lg:h-screen lg:flex-row lg:overflow-hidden">
      <section
        className="login-hero relative flex min-h-[58vh] overflow-hidden lg:h-full lg:w-[55%]"
        data-has-image={heroImageUrl ? 'true' : 'false'}
        style={heroStyle}
      >
        <div className="absolute left-6 top-6 z-20 sm:left-10 sm:top-10 lg:left-12">
          {logoUrl ? (
            <span
              aria-label={logoAlt}
              role="img"
              className="block h-12 w-[170px] max-w-[52vw] bg-contain bg-left bg-no-repeat"
              style={logoStyle}
            />
          ) : (
            <ConversioLogo />
          )}
        </div>

        <div className="absolute bottom-9 left-6 z-20 max-w-[760px] sm:left-10 lg:bottom-11 lg:left-12">
          <h1 className="login-headline text-[34px] leading-[1.08] tracking-[0.01em] text-white sm:text-[42px] lg:text-[48px]">
            <span>{headlineParts.main}</span>
            {headlineParts.accent ? (
              <>
                <br />
                <span className="text-[#efb804]">{headlineParts.accent}</span>
              </>
            ) : null}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-white">
            <span className="h-px w-24 bg-white/80 sm:w-36" />
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section
        className="login-brand-panel relative flex min-h-[42vh] items-center justify-center overflow-hidden bg-[#efb804] px-6 py-12 lg:h-full lg:w-[45%]"
        data-has-pattern={rightPatternUrl ? 'true' : 'false'}
      >
        {rightPatternUrl ? (
          <span
            aria-hidden="true"
            title={rightPatternAlt || undefined}
            className="login-right-pattern pointer-events-none absolute inset-0 z-0 block bg-no-repeat"
            style={patternStyle}
          />
        ) : null}

        <form
          action={startMicrosoftSignIn}
          className="relative z-10 flex min-h-[292px] w-full max-w-[390px] flex-col bg-[#fff5d8]/92 p-8 shadow-[0_14px_34px_rgba(36,28,0,0.08)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 text-[#5f6368]">
            <MicrosoftMark />
            <span className="text-[26px] font-normal tracking-[-0.02em]">Microsoft</span>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-[0.01em] text-neutral-950">Anmelden</h2>
            <button
              type="submit"
              disabled={!microsoftLoginEnabled}
              aria-label="Microsoft-Anmeldung starten"
              className="group mt-7 block w-full cursor-pointer text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-950/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff5d8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="text-[15px] tracking-[0.02em] text-neutral-700 transition-colors group-hover:text-neutral-950">
                E-Mail, Telefon oder Skype
              </span>
              <span className="mt-4 block h-px w-full bg-neutral-700/80 transition-colors group-hover:bg-neutral-950" />
            </button>

            {microsoftLoginEnabled ? (
              <p className="mt-5 text-[13px] leading-none text-neutral-600">
                Klicken Sie auf Weiter, um zur Microsoft-Anmeldung zu wechseln.
              </p>
            ) : (
              <p
                role="status"
                className="mt-5 rounded-md border border-amber-200 bg-amber-50/75 px-3 py-2 text-xs font-medium leading-5 text-amber-800"
              >
                Microsoft Login ist noch nicht korrekt konfiguriert.
              </p>
            )}

            {authError ? (
              <p
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700"
              >
                {authError}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex justify-end pt-8">
            <button
              type="submit"
              disabled={!microsoftLoginEnabled}
              className="inline-flex h-[38px] w-[92px] items-center justify-center rounded-lg bg-[#3d4248] text-sm font-semibold text-white transition-colors hover:bg-[#303640] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#3d4248]"
            >
              Weiter
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
