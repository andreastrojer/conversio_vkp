'use client'

import {ArrowLeft, Hexagon} from 'lucide-react'
import Link from 'next/link'
import type {ReactNode} from 'react'

type BottomBackLinkProps = {
  href: string
  children: ReactNode
  className?: string
  markerUrl?: string
  scroll?: boolean
}

export function BottomBackLink({
  href,
  children,
  className = '',
  markerUrl,
  scroll,
}: BottomBackLinkProps) {
  return (
    <Link
      href={href}
      scroll={scroll}
      className={`group inline-grid h-[54px] w-[54px] place-items-center text-[#efb804] transition-transform duration-150 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${className}`}
    >
      <span className="relative grid h-full w-full place-items-center" aria-hidden="true">
        {markerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={markerUrl}
            alt=""
            className="absolute h-[40px] w-[40px] object-contain"
          />
        ) : (
          <Hexagon
            className="absolute h-[40px] w-[40px]"
            strokeWidth={2.4}
          />
        )}
        <ArrowLeft
          className="relative h-[17px] w-[17px] -translate-x-px"
          strokeWidth={3}
        />
      </span>
      <span className="sr-only">{children}</span>
    </Link>
  )
}
