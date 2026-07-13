'use client'

import {ChevronDown, UserRound} from 'lucide-react'
import {type ReactNode, useEffect, useId, useRef, useState} from 'react'

type AccountMenuClientProps = {
  displayName: string
  loginIdentity: string
  menuIconUrl?: string
  patternUrl?: string
  logoutControl: ReactNode
}

export function AccountMenuClient({
  displayName,
  loginIdentity,
  menuIconUrl,
  patternUrl,
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
        className="group inline-flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[#d8dcdf] bg-white text-[#3d4248] shadow-[0_12px_28px_rgba(61,66,72,0.10)] transition hover:-translate-y-px hover:border-[#c7ccd0] hover:shadow-[0_14px_32px_rgba(61,66,72,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3d4248] aria-expanded:border-[#efb804]"
        aria-label={isOpen ? 'Profilmenü schließen' : 'Profilmenü öffnen'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="grid h-[36px] w-[36px] place-items-center overflow-hidden rounded-full bg-transparent text-[#111111]" aria-hidden="true">
          {menuIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={menuIconUrl} alt="" className="h-[29px] w-[29px] object-contain" />
          ) : (
            <UserRound size={26} strokeWidth={2.2} />
          )}
        </span>

        <ChevronDown
          className="absolute bottom-[1px] right-[-2px] h-[18px] w-[18px] rounded-full border border-[#d8dcdf] bg-white p-[3px] text-[#6b7075] shadow-[0_2px_8px_rgba(61,66,72,0.12)] transition group-aria-expanded:rotate-180"
          size={14}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={popoverId}
          className="absolute right-0 top-[calc(100%+12px)] w-[min(312px,calc(100vw-40px))] overflow-hidden rounded-[14px] border border-[#e1e4e6] bg-white shadow-[0_20px_46px_rgba(61,66,72,0.13)]"
          role="dialog"
          aria-label="Microsoft-Kontoinformationen"
        >
          <div className="relative overflow-hidden px-[24px] pb-[22px] pt-[24px]">
            {patternUrl ? (
              <span
                className="pointer-events-none absolute -right-[18px] -top-[20px] h-[88px] w-[88px] bg-contain bg-center bg-no-repeat opacity-[0.30] [filter:brightness(0)_saturate(100%)_invert(21%)_sepia(7%)_saturate(703%)_hue-rotate(169deg)_brightness(72%)_contrast(96%)]"
                style={{backgroundImage: `url("${patternUrl}")`}}
                aria-hidden="true"
              />
            ) : null}

            <div className="relative min-w-0">
              <strong className="block truncate pr-[56px] text-[20px] font-semibold leading-none text-[#3d4248]">
                {displayName}
              </strong>
              <span className="mt-[8px] block break-words text-[13px] font-normal leading-snug text-[#72787e]">
                {loginIdentity}
              </span>
            </div>
          </div>

          <div className="border-t border-[#eceeef] px-[22px] py-4">{logoutControl}</div>
        </div>
      ) : null}
    </div>
  )
}
