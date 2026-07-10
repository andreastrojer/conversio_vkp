import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import type {ChapterNavigationItem} from '@/lib/about'
import type {CustomerGroup} from '@/lib/customerSelection'
import Link from 'next/link'

type AboutScreenProps = {
  customerType: CustomerGroup
  headline?: string | null
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt?: string
}

const fallbackHeadline = 'WER WIR SIND'
const patternPositionClassName =
  'pointer-events-none fixed right-[clamp(-360px,-15vw,-210px)] bottom-[clamp(-360px,-22vh,-220px)] z-0 block h-[clamp(780px,min(62vw,94vh),1120px)] w-[clamp(780px,min(62vw,94vh),1120px)] bg-contain bg-center bg-no-repeat max-[1400px]:right-[clamp(-320px,-15vw,-190px)] max-[1400px]:bottom-[clamp(-330px,-21vh,-205px)] max-[1400px]:h-[clamp(720px,min(59vw,90vh),940px)] max-[1400px]:w-[clamp(720px,min(59vw,90vh),940px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!right-[clamp(-340px,-16vw,-200px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!bottom-[clamp(-340px,-22vh,-215px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!h-[clamp(760px,min(58vw,92vh),980px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!w-[clamp(760px,min(58vw,92vh),980px)]'
const patternFallbackClassName = `${patternPositionClassName} opacity-[0.08] [transform:rotate(30deg)]`
const logoPositionClassName =
  'absolute left-[clamp(48px,3.9vw,60px)] top-[clamp(46px,3.9vw,60px)] z-10 [@media_(min-width:1024px)_and_(max-height:950px)]:left-[clamp(46px,3.2vw,60px)] [@media_(min-width:1024px)_and_(max-height:950px)]:top-[clamp(40px,4.6vh,52px)]'
const logoImageClassName =
  'block h-auto w-[clamp(196px,13.2vw,236px)] max-w-[242px] object-contain opacity-100 [filter:none] [image-rendering:auto] [transform:none] max-[1400px]:w-[clamp(184px,13.2vw,222px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!w-[clamp(176px,11.8vw,210px)]'
const contentPositionClassName =
  'absolute left-[clamp(48px,3.9vw,60px)] top-[47%] z-10 max-w-[min(600px,calc(100vw-570px))] -translate-y-1/2 max-[1400px]:max-w-[min(560px,calc(100vw-540px))] [@media_(min-width:1024px)_and_(max-height:950px)]:!left-[clamp(46px,3.6vw,60px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!top-[47%] [@media_(min-width:1024px)_and_(max-height:950px)]:!max-w-[min(520px,calc(100vw-500px))]'
const headlineClassName =
  'font-sans text-[clamp(44px,3.6vw,56px)] font-bold uppercase leading-[1.02] tracking-[0.028em] max-[1400px]:text-[50px] [@media_(min-width:1024px)_and_(max-height:950px)]:!text-[clamp(42px,3.5vw,50px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!tracking-[0.024em]'

export function AboutScreen({
  customerType,
  headline,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
}: AboutScreenProps) {
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const resolvedHeadline = (headline?.trim() || fallbackHeadline).toLocaleUpperCase('de-AT')

  return (
    <main
      className={`relative isolate min-h-screen w-screen overflow-hidden font-sans ${
        isBusiness ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
      }`}
    >
      {patternUrl ? (
        <span
          className={`${patternPositionClassName} ${
            isBusiness
              ? 'opacity-[0.10] [filter:brightness(0)_invert(1)]'
              : 'opacity-[0.86] [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]'
          }`}
          style={{backgroundImage: `url("${patternUrl}")`}}
          title={patternAlt || undefined}
          aria-hidden="true"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${patternFallbackClassName} ${isBusiness ? 'opacity-[0.07]' : ''}`}
        >
          <span
            className={`absolute inset-[84px] border-[58px] border-solid ${
              isBusiness ? 'border-white' : 'border-[#3d4248]'
            } [clip-path:polygon(50%_0,92%_25%,92%_75%,50%_100%,8%_75%,8%_25%)]`}
          />
          <span
            className={`absolute bottom-[18px] left-[30px] right-[30px] h-[58px] ${
              isBusiness ? 'bg-white' : 'bg-[#3d4248]'
            } [box-shadow:-84px_-184px_0_currentColor,122px_-332px_0_currentColor,-22px_-514px_0_currentColor] [transform:skewY(-31deg)]`}
          />
        </span>
      )}

      <div className={logoPositionClassName}>
        <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
          {pageLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pageLogoUrl} alt={logoAlt} className={logoImageClassName} />
          ) : (
            <span className="text-[21px] font-bold uppercase tracking-[0.08em]">Conversio Energie</span>
          )}
        </Link>
      </div>

      <section className={contentPositionClassName}>
        <h1 className={`${headlineClassName} ${isBusiness ? 'text-white' : 'text-[#3d4248]'}`}>
          {resolvedHeadline}
        </h1>
      </section>

      <ChapterNavigation
        customerType={customerType}
        items={navigationItems}
        currentKey="about"
        logoUrl={navigationLogoUrl}
        logoAlt={logoAlt}
      />
    </main>
  )
}
