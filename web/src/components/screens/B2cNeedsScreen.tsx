'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import type {ChapterNavigationItem} from '@/lib/about'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import type {
  B2cDetailSection,
  B2cDetailTab,
  B2cHouseConfig,
  B2cMedia,
  B2cNavigationItem,
  B2cProduct,
} from '@/lib/offer'
import {AnimatePresence, motion} from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

type B2cNeedsScreenProps = {
  initialProductSlug?: string
  headline?: string | null
  houseConfig?: B2cHouseConfig
  products: B2cProduct[]
  productNavigationItems: B2cNavigationItem[]
  productNavigationLeftArrowUrl?: string
  productNavigationRightArrowUrl?: string
  productNavigationCatalogIconUrl?: string
  productNavigationCatalogActiveIconUrl?: string
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  navigationArrowUrl?: string
}

function isVideo(media?: B2cMedia) {
  return media?.mediaType === 'video' || media?.mediaType === 'droneVideo'
}

function splitParagraphs(text?: string | null) {
  return (text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function normalizeNavigationLabel(value?: string | null) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
}

function getBottomNavigationSlotClassName(item: B2cNavigationItem) {
  const label = normalizeNavigationLabel(item.label)

  if (item.kind === 'catalog') {
    return 'w-[54px]'
  }

  if (label.includes('photovoltaik')) {
    return 'w-[122px]'
  }

  if (label.includes('batteriespeicher')) {
    return 'w-[168px]'
  }

  if (label.includes('warmepumpe')) {
    return 'w-[128px]'
  }

  if (label.includes('ladestation')) {
    return 'w-[132px]'
  }

  if (label.includes('energiegemeinschaft')) {
    return 'w-[198px]'
  }

  if (label.includes('matrix')) {
    return 'w-[76px]'
  }

  return 'w-[132px]'
}

function BackgroundMedia({media}: {media?: B2cMedia}) {
  if (media?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.imageUrl}
        alt={media.alt}
        className="absolute bottom-0 left-0 w-full object-cover"
        style={{
          height: 'calc(100% + var(--presentation-bleed-y, 0px))',
          top: 'calc(-1 * var(--presentation-bleed-y, 0px))',
        }}
      />
    )
  }

  if (media?.mediaUrl && isVideo(media)) {
    return (
      <video
        src={media.mediaUrl}
        aria-label={media.alt || undefined}
        className="absolute bottom-0 left-0 w-full object-cover"
        style={{
          height: 'calc(100% + var(--presentation-bleed-y, 0px))',
          top: 'calc(-1 * var(--presentation-bleed-y, 0px))',
        }}
        autoPlay
        loop
        muted
        playsInline
      />
    )
  }

  return null
}

function MarkerMedia({
  media,
  className,
}: {
  media?: B2cMedia
  className: string
}) {
  if (media?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={media.imageUrl} alt="" className={`${className} object-contain`} aria-hidden="true" />
    )
  }

  if (media?.mediaUrl && isVideo(media)) {
    return (
      <video
        src={media.mediaUrl}
        className={`${className} object-contain`}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
    )
  }

  return null
}

function PlusMarker({media, className}: {media?: B2cMedia; className?: string}) {
  if (media) {
    return <MarkerMedia media={media} className={className || 'h-[30px] w-[30px]'} />
  }

  return (
    <span
      className={`grid place-items-center text-white ${className || 'h-[30px] w-[30px]'}`}
      aria-hidden="true"
    >
      <Plus className="h-full w-full" strokeWidth={1.7} />
    </span>
  )
}

function StepMarker({
  number,
  media,
}: {
  number: number
  media?: B2cMedia
}) {
  if (media) {
    return (
      <span className="relative z-[1] grid h-[49px] w-[43px] shrink-0 place-items-center">
        <MarkerMedia media={media} className="absolute inset-0 h-full w-full" />
        <span className="relative z-[1] text-[16px] font-medium leading-none text-white">
          {number}
        </span>
      </span>
    )
  }

  return (
    <span
      className="grid h-[46px] w-[46px] shrink-0 place-items-center bg-white [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]"
      aria-hidden="true"
    >
      <span className="grid h-[39px] w-[39px] place-items-center bg-[#34393e] text-[16px] font-medium leading-none text-white [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]">
        {number}
      </span>
    </span>
  )
}

function ArrowMedia({
  media,
  direction,
}: {
  media?: B2cMedia
  direction: 'up' | 'down'
}) {
  if (media) {
    return <MarkerMedia media={media} className="h-[12px] w-[12px]" />
  }

  return direction === 'up' ? (
    <ChevronUp className="h-[14px] w-[14px]" strokeWidth={1.8} aria-hidden="true" />
  ) : (
    <ChevronDown className="h-[14px] w-[14px]" strokeWidth={1.8} aria-hidden="true" />
  )
}

function OverviewContent({sections}: {sections: B2cDetailSection[]}) {
  return (
    <div className="w-[500px] space-y-[30px]">
      {sections.map((section) => (
        <section key={section._key}>
          {section.title ? (
            <h2 className="text-[23px] font-bold uppercase leading-[1.1] text-white max-[1600px]:text-[24px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[25px]">
              {section.title}
            </h2>
          ) : null}
          {section.text ? (
            <div
              className={`${section.title ? 'mt-[26px]' : ''} space-y-[22px] text-[20px] leading-[1.45] text-white/95 max-[1600px]:text-[22px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[23px]`}
            >
              {splitParagraphs(section.text).map((paragraph, index) => (
                <p key={`${section._key}-paragraph-${index}`} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}

function FunctionContent({
  tab,
  processMarkerMedia,
}: {
  tab: B2cDetailTab
  processMarkerMedia?: B2cMedia
}) {
  const steps = tab.functionSteps
  const configuredVisibleSteps = tab.functionNavigation?.visibleSteps
  const visibleStepCount =
    typeof configuredVisibleSteps === 'number'
      ? Math.min(steps.length, Math.max(1, configuredVisibleSteps))
      : steps.length
  const lastPageStartIndex =
    steps.length > 0
      ? Math.floor((steps.length - 1) / visibleStepCount) * visibleStepCount
      : 0
  const [startIndex, setStartIndex] = useState(0)
  const safeStartIndex = Math.min(startIndex, lastPageStartIndex)
  const visibleSteps = steps.slice(safeStartIndex, safeStartIndex + visibleStepCount)
  const markerMedia = tab.functionNavigation?.stepMarkerMedia || processMarkerMedia

  return (
    <div className="relative w-[500px]">
      <div className="absolute right-[50px] top-[2px] z-[3] flex w-[24px] flex-col gap-[4px]">
        <button
          type="button"
          className="grid h-[24px] w-[24px] place-items-center rounded-full bg-white text-[#efb804] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb804] disabled:cursor-default disabled:bg-white/45 disabled:text-white/80"
          onClick={() =>
            setStartIndex((current) => Math.max(0, current - visibleStepCount))
          }
          disabled={safeStartIndex === 0}
          aria-label="Vorherige Funktionsschritte"
          title="Vorherige Funktionsschritte"
        >
          <ArrowMedia media={tab.functionNavigation?.upArrowMedia} direction="up" />
        </button>
        <button
          type="button"
          className="grid h-[24px] w-[24px] place-items-center rounded-full bg-white text-[#efb804] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb804] disabled:cursor-default disabled:bg-white/45 disabled:text-white/80"
          onClick={() =>
            setStartIndex((current) =>
              Math.min(lastPageStartIndex, current + visibleStepCount),
            )
          }
          disabled={safeStartIndex === lastPageStartIndex}
          aria-label="Weitere Funktionsschritte"
          title="Weitere Funktionsschritte"
        >
          <ArrowMedia media={tab.functionNavigation?.downArrowMedia} direction="down" />
        </button>
      </div>

      <ol className="relative flex min-h-[390px] flex-col justify-start">
        {visibleSteps.map((step, index) => {
          const isFinalStep = safeStartIndex + index === steps.length - 1

          return (
            <li
              key={step._key}
              className="relative z-[1] grid min-h-[142px] grid-cols-[46px_minmax(0,1fr)] items-start gap-[44px]"
            >
              {!isFinalStep ? (
                <span
                  className={`absolute left-[20px] top-[47px] z-0 w-[3px] bg-white ${
                    index === visibleSteps.length - 1 ? '-bottom-[320px]' : '-bottom-[2px]'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <StepMarker number={step.stepNumber} media={markerMedia} />
              <div className="max-w-[310px] pt-[8px]">
                <h2 className="text-[22px] font-bold uppercase leading-[1.08] text-white max-[1600px]:text-[24px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[25px]">
                  {step.title}
                </h2>
                <div className="mt-[12px] space-y-[10px] text-[20px] leading-[1.35] text-white/95 max-[1600px]:text-[22px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[23px]">
                  {splitParagraphs(step.text).map((paragraph, paragraphIndex) => (
                    <p
                      key={`${step._key}-paragraph-${paragraphIndex}`}
                      className="whitespace-pre-line"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function InterplayContent({
  tab,
  markerMedia,
}: {
  tab: B2cDetailTab
  markerMedia?: B2cMedia
}) {
  return (
    <div className="w-[680px]">
      <div>
        {tab.contentItemsTitle ? (
          <h3 className="mb-[16px] text-[22px] font-bold uppercase leading-[1.1] text-white max-[1600px]:text-[23px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[24px]">
            {tab.contentItemsTitle}
          </h3>
        ) : null}
        <div className="space-y-[10px]">
          {tab.contentItems.map((item) => (
            <div
              key={item._key}
              className="grid grid-cols-[22px_minmax(0,1fr)] items-center gap-[18px]"
            >
              <PlusMarker media={markerMedia} className="h-[18px] w-[18px]" />
              <div className="text-[20px] leading-[1.4] text-white/95 max-[1600px]:text-[22px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[23px]">
                {item.title ? (
                  <strong className="block font-semibold uppercase text-white">{item.title}</strong>
                ) : null}
                {item.text ? (
                  <span className={item.title ? 'mt-[3px] block' : undefined}>{item.text}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductBottomNavigation({
  items,
  catalogLabel,
  selectedProductSlug,
  leftArrowUrl,
  rightArrowUrl,
  catalogIconUrl,
  catalogActiveIconUrl,
  onOpenCatalog,
  onOpenProduct,
  onOpenScreen,
}: {
  items: B2cNavigationItem[]
  catalogLabel: string
  selectedProductSlug?: string
  leftArrowUrl?: string
  rightArrowUrl?: string
  catalogIconUrl?: string
  catalogActiveIconUrl?: string
  onOpenCatalog: () => void
  onOpenProduct: (slug: string) => void
  onOpenScreen: (href: string) => void
}) {
  const bottomNavigation: B2cNavigationItem[] = [
    {key: 'b2c-house', label: catalogLabel, kind: 'catalog'},
    ...items,
  ]
  const currentIndex = selectedProductSlug
    ? bottomNavigation.findIndex(
        (item) => item.kind === 'product' && item.slug === selectedProductSlug,
      )
    : 0
  const previousItem = currentIndex > 0 ? bottomNavigation[currentIndex - 1] : undefined
  const nextItem =
    currentIndex >= 0 && currentIndex < bottomNavigation.length - 1
      ? bottomNavigation[currentIndex + 1]
      : undefined

  function openItem(item: B2cNavigationItem | undefined) {
    if (item?.kind === 'catalog') {
      onOpenCatalog()
    } else if (item?.kind === 'product' && item.slug) {
      onOpenProduct(item.slug)
    } else if (item?.kind === 'screen' && item.href) {
      onOpenScreen(item.href)
    }
  }

  return (
    <nav
      className="absolute bottom-[36px] left-[60px] z-[8] isolate flex h-[48px] w-max items-center bg-transparent"
      aria-label="Produktnavigation"
    >
      <span
        className={`pointer-events-none absolute inset-0 z-0 ${
          selectedProductSlug ? 'bg-white/25' : 'bg-[#464b50]/55'
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        className="absolute -left-[20px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] disabled:cursor-default"
        onClick={() => openItem(previousItem)}
        disabled={!previousItem || previousItem.kind === 'screen'}
        aria-label={previousItem?.label || undefined}
      >
        {leftArrowUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={leftArrowUrl}
            alt=""
            className="h-[92px] w-[26px] object-contain"
            aria-hidden="true"
          />
        ) : (
          <ArrowLeft className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
        )}
      </button>

      <div className="relative z-[1] flex w-auto items-center justify-start gap-[40px] pl-[10px] pr-[42px]">
        {bottomNavigation.map((item) => {
          const isCatalog = item.kind === 'catalog'
          const isActive =
            (item.kind === 'product' && item.slug === selectedProductSlug) ||
            (isCatalog && !selectedProductSlug)
          const slotClassName = getBottomNavigationSlotClassName(item)
          const usesActiveCatalogIcon = Boolean(
            isCatalog && isActive && catalogActiveIconUrl,
          )
          const itemCatalogIconUrl =
            usesActiveCatalogIcon
              ? catalogActiveIconUrl || catalogIconUrl || item.iconUrl
              : catalogIconUrl || item.iconUrl
          const commonClassName = `inline-flex items-center justify-center rounded-full whitespace-nowrap text-[16px] font-semibold uppercase leading-none tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] ${
            isActive ? 'bg-[#efb804] text-[#2a2e33]' : 'text-white'
          } ${
            isCatalog
              ? itemCatalogIconUrl
                ? 'h-[26px] w-[66px] p-0 leading-none'
                : `h-[26px] min-w-[66px] px-[12px] ${
                    isActive ? '' : 'bg-white text-[#2a2e33]'
                  }`
              : isActive
                ? 'h-[32px] px-[26px]'
                : 'h-[26px] px-[12px]'
          }`
          const content = isCatalog ? (
            <>
              {itemCatalogIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={itemCatalogIconUrl}
                  alt=""
                  className={
                    usesActiveCatalogIcon
                      ? 'block h-[16px] w-[16px] shrink-0 object-contain'
                      : 'block h-[26px] w-[66px] shrink-0 object-contain'
                  }
                  aria-hidden="true"
                />
              ) : (
                <ListFilter
                  className="h-[17px] w-[17px] text-[#2a2e33]"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">{item.label}</span>
            </>
          ) : (
            item.label
          )

          return (
            <span key={item.key} className={`flex h-[48px] shrink-0 items-center justify-center ${slotClassName}`}>
              <button
                type="button"
                className={commonClassName}
                aria-current={isActive || (isCatalog && !selectedProductSlug) ? 'page' : undefined}
                onClick={() => openItem(item)}
              >
                {content}
              </button>
            </span>
          )
        })}
      </div>

      {nextItem?.kind === 'screen' && nextItem.href ? (
        <Link
          href={nextItem.href}
          className="absolute -right-[20px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804]"
          aria-label={nextItem.label}
        >
          {rightArrowUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rightArrowUrl}
              alt=""
              className="h-[92px] w-[26px] object-contain"
              aria-hidden="true"
            />
          ) : (
            <ArrowRight className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
          )}
        </Link>
      ) : (
        <button
          type="button"
          className="absolute -right-[20px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] disabled:cursor-default"
          onClick={() => openItem(nextItem)}
          disabled={!nextItem}
          aria-label={nextItem?.label || undefined}
        >
          {rightArrowUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rightArrowUrl}
              alt=""
              className="h-[92px] w-[26px] object-contain"
              aria-hidden="true"
            />
          ) : (
            <ArrowRight className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
          )}
        </button>
      )}
    </nav>
  )
}

export function B2cNeedsScreen({
  initialProductSlug,
  headline,
  houseConfig,
  products,
  productNavigationItems,
  productNavigationLeftArrowUrl,
  productNavigationRightArrowUrl,
  productNavigationCatalogIconUrl,
  productNavigationCatalogActiveIconUrl,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  navigationArrowUrl,
}: B2cNeedsScreenProps) {
  const router = useRouter()
  const initialProduct = products.find((product) => product.slug === initialProductSlug)
  const [selectedProductSlug, setSelectedProductSlug] = useState(initialProduct?.slug || '')
  const [expandedHotspotKey, setExpandedHotspotKey] = useState<string | null>(null)
  const selectedProduct = products.find((product) => product.slug === selectedProductSlug)
  const [activeTabKey, setActiveTabKey] = useState(
    initialProduct?.detailTabs[0]?.key || '',
  )
  const activeTab =
    selectedProduct?.detailTabs.find((tab) => tab.key === activeTabKey) ||
    selectedProduct?.detailTabs[0]
  const contentTopClassName =
    activeTab?.key === 'overview'
      ? 'top-[400px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[390px]'
      : activeTab?.key === 'functions'
        ? 'top-[390px]'
        : 'top-[520px]'
  const contentBottomClassName =
    activeTab?.key === 'functions' || activeTab?.key === 'overview'
      ? 'bottom-[84px]'
      : 'bottom-[105px]'
  const contentOverflowClassName =
    activeTab?.key === 'functions'
      ? 'overflow-hidden'
      : activeTab?.key === 'interplay'
        ? 'overflow-visible'
        : 'overflow-y-auto'
  const contentAlignmentClassName =
    activeTab?.key === 'overview' ? 'flex items-center' : ''
  const contentWidthClassName =
    activeTab?.key === 'interplay' ? 'w-[720px]' : 'w-[560px]'
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = inverseLogoUrl || logoUrl

  function openProduct(product: B2cProduct) {
    setExpandedHotspotKey(null)
    setSelectedProductSlug(product.slug)
    setActiveTabKey(product.detailTabs[0]?.key || '')
    router.push(`/needs?type=b2c&product=${encodeURIComponent(product.slug)}`, {scroll: false})
  }

  function closeProduct() {
    setExpandedHotspotKey(null)
    setSelectedProductSlug('')
    setActiveTabKey('')
    router.push('/needs?type=b2c', {scroll: false})
  }

  function openProductBySlug(slug: string) {
    const product = products.find((item) => item.slug === slug)

    if (product) {
      openProduct(product)
      return
    }

    router.push(`/needs?type=b2c&product=${encodeURIComponent(slug)}`)
  }

  function handleHotspotClick(hotspot: B2cHouseConfig['hotspots'][number]) {
    const isTabletViewport = window.matchMedia(
      '(min-width: 768px) and (max-width: 1366px)',
    ).matches

    if (isTabletViewport && expandedHotspotKey !== hotspot._key) {
      setExpandedHotspotKey(hotspot._key)
      return
    }

    openProduct(hotspot.product)
  }

  return (
    <PresentationViewport backgroundClassName="bg-[#34393e]">
      <main className="relative isolate h-full w-full overflow-visible bg-[#34393e] font-sans text-white">
        <AnimatePresence mode="wait" initial={false}>
          {selectedProduct ? (
            <motion.section
              key={`product-${selectedProduct._id}`}
              className="absolute inset-0"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.32}}
              aria-labelledby="b2c-product-title"
            >
              <BackgroundMedia media={selectedProduct.backgroundMedia} />
              <div className="absolute left-[60px] top-[220px] z-[3]">
                <h1
                  id="b2c-product-title"
                  className="max-w-[560px] font-sans text-[54px] font-bold uppercase leading-[0.98] text-white"
                >
                  {selectedProduct.detailTitle}
                </h1>

                <div
                  className="mt-[44px] flex items-center gap-[34px]"
                  role="tablist"
                  aria-label={selectedProduct.detailTitle}
                >
                  {selectedProduct.detailTabs.map((tab) => {
                    const isActive = tab.key === activeTab?.key

                    return (
                      <button
                        key={tab._key}
                        type="button"
                        className={`relative pb-[12px] text-[18px] font-medium uppercase leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${
                          isActive ? 'text-[#efb804]' : 'text-white hover:text-[#efb804]'
                        }`}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTabKey(tab.key)}
                      >
                        {tab.title}
                        {isActive ? (
                          <span
                            className="absolute inset-x-[-10px] bottom-0 h-px bg-[#efb804]"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div
                className={`absolute left-[60px] z-[3] ${contentTopClassName} ${contentBottomClassName} ${contentOverflowClassName} ${contentAlignmentClassName}`}
              >
                <div className={`relative ${contentWidthClassName}`}>
                  <div className="relative z-[1]">
                    {activeTab?.key === 'overview' ? (
                      <OverviewContent sections={activeTab.sections} />
                    ) : activeTab?.key === 'functions' ? (
                      <FunctionContent
                        key={activeTab._key}
                        tab={activeTab}
                        processMarkerMedia={selectedProduct.processMarkerMedia}
                      />
                    ) : activeTab?.key === 'interplay' ? (
                      <InterplayContent
                        tab={activeTab}
                        markerMedia={selectedProduct.benefitMarkerMedia}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {activeTab?.key === 'functions' ? (
                <span
                  className="absolute bottom-0 left-[80px] z-[3] h-[36px] w-[3px] bg-white"
                  aria-hidden="true"
                />
              ) : null}
            </motion.section>
          ) : (
            <motion.section
              key="house"
              className="absolute inset-0"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.32}}
              aria-label={headline || undefined}
              onClick={() => setExpandedHotspotKey(null)}
            >
              <BackgroundMedia media={houseConfig?.backgroundMedia} />

              <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[940px] [@media(min-width:768px)_and_(max-width:1366px)]:fixed [@media(min-width:768px)_and_(max-width:1366px)]:top-1/2 [@media(min-width:768px)_and_(max-width:1366px)]:h-auto [@media(min-width:768px)_and_(max-width:1366px)]:aspect-[16/9] [@media(min-width:768px)_and_(max-width:1366px)]:-translate-y-1/2">
                {houseConfig?.hotspots.map((hotspot) => {
                  const isExpanded = expandedHotspotKey === hotspot._key

                  return (
                    <span
                      key={hotspot._key}
                      className={`absolute h-0 w-0 hover:z-[2] focus-within:z-[2] ${
                        isExpanded ? 'z-[2]' : ''
                      } ${
                        hotspot.yPercent < 50
                          ? '[@media(min-width:768px)_and_(max-width:1366px)]:translate-x-[28px] [@media(min-width:768px)_and_(max-width:1366px)]:translate-y-[28px]'
                          : '[@media(min-width:768px)_and_(max-width:1366px)]:-translate-y-[28px]'
                      }`}
                      style={{left: `${hotspot.xPercent}%`, top: `${hotspot.yPercent}%`}}
                    >
                      <button
                        type="button"
                        className="group pointer-events-auto absolute left-[-24px] top-[-24px] h-[49px] w-[48px] appearance-none overflow-visible border-0 bg-transparent p-0 text-white transition-transform duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804]"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleHotspotClick(hotspot)
                        }}
                        aria-label={`${hotspot.label} öffnen`}
                        aria-expanded={isExpanded}
                      >
                        <span
                          className={`absolute left-0 top-0 grid h-[48px] w-[48px] place-items-center transition-[opacity,transform,filter] duration-200 ease-out group-hover:rotate-45 group-hover:scale-[0.35] group-hover:opacity-0 group-hover:blur-[3px] group-hover:delay-0 group-focus-visible:rotate-45 group-focus-visible:scale-[0.35] group-focus-visible:opacity-0 group-focus-visible:blur-[3px] group-focus-visible:delay-0 ${
                            isExpanded
                              ? 'rotate-45 scale-[0.35] opacity-0 blur-[3px] delay-0'
                              : 'opacity-100 blur-0 delay-150'
                          }`}
                        >
                        {hotspot.media ? (
                          <MarkerMedia media={hotspot.media} className="h-[30px] w-[30px]" />
                        ) : (
                          <span className="grid h-[30px] w-[30px] place-items-center bg-[#efb804] text-[#34393e] shadow-[0_6px_24px_rgba(0,0,0,0.3)] [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]">
                            <Plus className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden="true" />
                          </span>
                        )}
                        </span>

                        <span
                          className="absolute left-0 top-0 h-[49px] w-[48px] overflow-visible bg-transparent"
                          aria-hidden="true"
                        >
                          <span className="grid h-[49px] w-[48px] shrink-0 place-items-center">
                          {houseConfig.expandedHotspotMedia ? (
                            <MarkerMedia
                              media={houseConfig.expandedHotspotMedia}
                              className={`h-[49px] w-[19px] origin-center transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-hover:scale-y-100 group-hover:opacity-100 group-hover:blur-0 group-focus-visible:scale-x-100 group-focus-visible:scale-y-100 group-focus-visible:opacity-100 group-focus-visible:blur-0 ${
                                isExpanded
                                  ? 'scale-x-100 scale-y-100 opacity-100 blur-0'
                                  : 'scale-x-[0.6] scale-y-0 opacity-0 blur-[2px]'
                              }`}
                            />
                          ) : (
                            <span
                              className={`relative h-[49px] w-[19px] origin-center transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-hover:scale-y-100 group-hover:opacity-100 group-hover:blur-0 group-focus-visible:scale-x-100 group-focus-visible:scale-y-100 group-focus-visible:opacity-100 group-focus-visible:blur-0 ${
                                isExpanded
                                  ? 'scale-x-100 scale-y-100 opacity-100 blur-0'
                                  : 'scale-x-[0.6] scale-y-0 opacity-0 blur-[2px]'
                              }`}
                            >
                              <ChevronUp
                                className="absolute left-1/2 top-[1px] h-[14px] w-[14px] -translate-x-1/2"
                                strokeWidth={1.8}
                              />
                              <ChevronDown
                                className="absolute bottom-[1px] left-1/2 h-[14px] w-[14px] -translate-x-1/2"
                                strokeWidth={1.8}
                              />
                            </span>
                          )}
                          </span>

                          <span
                            className={`absolute left-[15px] top-1/2 flex -translate-y-1/2 items-center overflow-hidden bg-transparent transition-[max-width,opacity,transform,clip-path] duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[340px] group-hover:translate-x-0 group-hover:opacity-100 group-hover:[clip-path:inset(0_0_0_0)] group-hover:delay-75 group-focus-visible:max-w-[340px] group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:[clip-path:inset(0_0_0_0)] group-focus-visible:delay-75 ${
                              isExpanded
                                ? 'max-w-[340px] translate-x-0 opacity-100 [clip-path:inset(0_0_0_0)] delay-75'
                                : 'max-w-0 -translate-x-[8px] opacity-0 [clip-path:inset(0_100%_0_0)]'
                            }`}
                          >
                          <span className="min-w-max whitespace-nowrap bg-transparent pr-[14px] text-left text-[18px] font-semibold uppercase leading-none text-white">
                            {hotspot.label}
                          </span>
                          </span>
                        </span>
                      </button>
                    </span>
                  )
                })}
              </div>

            </motion.section>
          )}
        </AnimatePresence>

        <ProductBottomNavigation
          items={productNavigationItems}
          catalogLabel={headline?.trim() || 'Hausansicht'}
          selectedProductSlug={selectedProduct?.slug}
          leftArrowUrl={productNavigationLeftArrowUrl}
          rightArrowUrl={productNavigationRightArrowUrl}
          catalogIconUrl={productNavigationCatalogIconUrl}
          catalogActiveIconUrl={productNavigationCatalogActiveIconUrl}
          onOpenCatalog={closeProduct}
          onOpenProduct={openProductBySlug}
          onOpenScreen={(href) => router.push(href)}
        />

        <div className={brandLogoPositionClassName}>
          <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
            {pageLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pageLogoUrl} alt={logoAlt} className={brandLogoImageClassName} />
            ) : (
              <span className="text-[21px] font-bold uppercase">{logoAlt}</span>
            )}
          </Link>
        </div>

        <ChapterNavigation
          customerType="b2c"
          items={navigationItems}
          currentKey="needs"
          logoUrl={navigationLogoUrl}
          logoAlt={logoAlt}
          navigationArrowUrl={navigationArrowUrl}
        />
      </main>
    </PresentationViewport>
  )
}
