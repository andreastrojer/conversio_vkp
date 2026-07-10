'use client'

import {ChevronDown, UserRound} from 'lucide-react'
import {type ReactNode, useEffect, useId, useRef, useState} from 'react'

type AccountMenuClientProps = {
  displayName: string
  loginIdentity: string
  menuIconUrl?: string
  logoutControl: ReactNode
}

export function AccountMenuClient({
  displayName,
  loginIdentity,
  menuIconUrl,
  logoutControl,
}: AccountMenuClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={menuRef}
      className="absolute right-[clamp(52px,4vw,72px)] top-[clamp(46px,3.8vw,60px)] z-20 font-sans max-[900px]:right-7 max-[900px]:top-7"
    >
      <button
        ref={triggerRef}
        type="button"
        className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d8dcdf] bg-white text-[#3d4248] shadow-[0_14px_34px_rgba(61,66,72,0.10)] transition hover:-translate-y-px hover:border-[#c7ccd0] hover:shadow-[0_16px_38px_rgba(61,66,72,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d4248] aria-expanded:border-[#efb804]"
        aria-label={isOpen ? 'Profilmenü schließen' : 'Profilmenü öffnen'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-[#f4f5f5] text-[#3d4248]" aria-hidden="true">
          {menuIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={menuIconUrl} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <UserRound size={21} strokeWidth={2} />
          )}
        </span>

        <ChevronDown
          className="absolute -bottom-1 right-0 h-4 w-4 rounded-full bg-white p-[2px] text-[#6b7075] shadow-[0_2px_8px_rgba(61,66,72,0.12)] transition group-aria-expanded:rotate-180"
          size={14}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={popoverId}
          className="absolute right-0 top-[calc(100%+12px)] w-[min(300px,calc(100vw-40px))] overflow-hidden rounded-[14px] border border-[#e1e4e6] bg-white shadow-[0_22px_54px_rgba(61,66,72,0.14)]"
          role="dialog"
          aria-label="Microsoft-Kontoinformationen"
        >
          <div className="flex items-center gap-3 border-b border-[#eceeef] px-4 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f4f5f5] text-[#3d4248]" aria-hidden="true">
              {menuIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={menuIconUrl} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <UserRound size={22} strokeWidth={2} />
              )}
            </span>

            <div className="min-w-0">
              <span className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#3d4248]">
                Microsoft-Konto
              </span>
              <span className="mt-1 block text-[12px] font-normal text-[#7c8288]">
                Angemeldetes Profil
              </span>
            </div>
          </div>

          <div className="px-4 py-4">
            <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b9095]">
              Angemeldet als
            </span>
            <strong className="mt-1 block truncate text-[17px] font-semibold leading-tight text-[#3d4248]">
              {displayName}
            </strong>
            <span className="mt-1 block break-words text-[13px] font-normal leading-snug text-[#72787e]">
              {loginIdentity}
            </span>
          </div>

          <div className="border-t border-[#eceeef] px-4 py-4">{logoutControl}</div>
        </div>
      ) : null}
    </div>
  )
}
