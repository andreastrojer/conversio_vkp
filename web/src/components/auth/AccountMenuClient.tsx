'use client'

import styles from '@/components/auth/AccountMenu.module.css'
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
    <div ref={menuRef} className={`${styles.accountMenu} font-barlow`}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={isOpen ? 'Profilmenü schließen' : 'Profilmenü öffnen'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          {menuIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={menuIconUrl} alt="" />
          ) : (
            <UserRound size={21} strokeWidth={2} />
          )}
        </span>

        <span className={styles.triggerText}>
          <strong>Konto</strong>
          <span>Profil</span>
        </span>

        <ChevronDown
          className={styles.chevron}
          data-open={isOpen}
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={popoverId}
          className={styles.popover}
          role="dialog"
          aria-label="Microsoft-Kontoinformationen"
        >
          <div className={styles.popoverHeader}>
            <span className={styles.popoverIcon} aria-hidden="true">
              {menuIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={menuIconUrl} alt="" />
              ) : (
                <UserRound size={22} strokeWidth={2} />
              )}
            </span>

            <div className={styles.providerBlock}>
              <span className={styles.providerLabel}>Microsoft-Konto</span>
              <span className={styles.providerHint}>Angemeldetes Profil</span>
            </div>
          </div>

          <div className={styles.identityBlock}>
            <span className={styles.identityLabel}>Angemeldet als</span>
            <strong>{displayName}</strong>
            <span className={styles.identityEmail}>{loginIdentity}</span>
          </div>

          <div className={styles.logoutArea}>{logoutControl}</div>
        </div>
      ) : null}
    </div>
  )
}
