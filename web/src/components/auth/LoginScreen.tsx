'use client'

import {motion} from 'framer-motion'
import {ArrowRight} from 'lucide-react'
import {signIn} from 'next-auth/react'
import type {CSSProperties} from 'react'

type LoginSection = {
  _key?: string
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  sortOrder?: number | null
} | null

type LoginScreenProps = {
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
const fallbackSubline = 'Melden Sie sich mit Ihrem Microsoft-Konto an.'
const fallbackCtaLabel = 'Mit Microsoft anmelden'

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
  headline,
  subline,
  ctaLabel,
  heroImageUrl,
  logoUrl,
  logoAlt = 'Conversio Energie',
  rightPatternUrl,
  rightPatternAlt = '',
  sections,
}: LoginScreenProps) {
  const handleMicrosoftSignIn = () => {
    void signIn('microsoft-entra-id')
  }

  const resolvedHeadline = headline?.trim() || fallbackHeadline
  const resolvedSubline = subline?.trim() || fallbackSubline
  const resolvedCtaLabel = ctaLabel?.trim() || fallbackCtaLabel
  const headlineParts = splitHeadline(resolvedHeadline)
  const visibleSections = (sections || [])
    .filter((section): section is NonNullable<LoginSection> => Boolean(section?.title || section?.text))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 2)

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
              className="block h-12 w-[240px] max-w-[52vw] bg-contain bg-left bg-no-repeat"
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
            className="pointer-events-none absolute bottom-0 right-0 z-0 block h-[76%] w-[82%] bg-contain bg-right-bottom bg-no-repeat opacity-25"
            style={patternStyle}
          />
        ) : null}

        <motion.div
          initial={{opacity: 0, y: 16}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.28, ease: 'easeOut'}}
          className="relative z-10 w-full max-w-[470px] bg-[#fff6d8]/92 p-9 shadow-[0_24px_70px_rgba(36,28,0,0.18)] backdrop-blur-sm sm:p-10 lg:p-11"
        >
          <div className="flex items-center gap-3 text-[#5f6368]">
            <MicrosoftMark />
            <span className="text-[27px] font-normal tracking-[-0.02em]">Microsoft</span>
          </div>

          <div className="mt-14">
            <h2 className="text-[30px] font-semibold tracking-[0.01em] text-neutral-950">Anmelden</h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-neutral-700">
              {resolvedSubline}
            </p>
          </div>

          {visibleSections.length > 0 ? (
            <div className="mt-7 space-y-3 text-sm leading-6 text-neutral-700">
              {visibleSections.map((section, index) => (
                <div key={section._key || `${section.title || 'section'}-${index}`}>
                  {section.eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      {section.eyebrow}
                    </p>
                  ) : null}
                  {section.title ? <p className="font-medium text-neutral-900">{section.title}</p> : null}
                  {section.text ? <p>{section.text}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-12 flex justify-end">
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#3f4650] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#303640] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              {resolvedCtaLabel}
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
