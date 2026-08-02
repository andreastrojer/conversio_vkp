'use client'

import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import type {ReactNode} from 'react'

type BottomBackLinkProps = {
  href: string
  children: ReactNode
  className?: string
  scroll?: boolean
}

export function BottomBackLink({
  href,
  children,
  className = '',
  scroll,
}: BottomBackLinkProps) {
  return (
    <Link
      href={href}
      scroll={scroll}
      className={`group inline-grid h-[42px] w-[42px] place-items-center rounded-full bg-[#efb804] text-[#2a2e33] shadow-[0_12px_26px_rgba(42,46,51,0.18)] transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-[#f6c41a] hover:shadow-[0_16px_32px_rgba(42,46,51,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${className}`}
    >
      <ArrowLeft
        className="h-[22px] w-[22px] transition-transform duration-150 group-hover:-translate-x-0.5"
        strokeWidth={2.8}
        aria-hidden="true"
      />
      <span className="sr-only">{children}</span>
    </Link>
  )
}
