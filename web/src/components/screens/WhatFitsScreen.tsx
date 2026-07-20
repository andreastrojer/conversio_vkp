'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import type {ChapterNavigationItem} from '@/lib/about'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import type {
  ProductDetailSection,
  ProductDetailTab,
  ProductNavigationItem,
  WhatFitsProduct,
} from '@/lib/whatFits'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowLeft, ArrowRight, Hexagon, ListFilter} from 'lucide-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'

type WhatFitsScreenProps = {
  customerType: CustomerGroup
  initialProductSlug?: string
  headline?: string | null
  subline?: string | null
  products: WhatFitsProduct[]
  bottomNavigation: ProductNavigationItem[]
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
  navigationArrowUrl?: string
  productNavigationLeftArrowUrl?: string
  productNavigationRightArrowUrl?: string
  productNavigationCatalogIconUrl?: string
}

type ProductView = 'catalog' | 'detail'

type ResolvedMedia = {
  key: string
  kind: 'image' | 'video' | 'empty'
  url?: string
  alt: string
}

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat opacity-[0.065] [filter:brightness(0)_invert(1)]'

function isVideo(mediaType?: string | null) {
  return mediaType === 'video' || mediaType === 'droneVideo'
}

function resolveCatalogMedia(product: WhatFitsProduct): ResolvedMedia {
  if (product.catalogMediaImageUrl) {
    return {
      key: `${product.slug}-catalog-media-image`,
      kind: 'image',
      url: product.catalogMediaImageUrl,
      alt: product.catalogMediaAlt,
    }
  }

  if (product.catalogMediaUrl && isVideo(product.catalogMediaType)) {
    return {
      key: `${product.slug}-catalog-media-video`,
      kind: 'video',
      url: product.catalogMediaUrl,
      alt: product.catalogMediaAlt,
    }
  }

  if (product.catalogImageUrl) {
    return {
      key: `${product.slug}-catalog-image`,
      kind: 'image',
      url: product.catalogImageUrl,
      alt: product.catalogLabel,
    }
  }

  return {key: `${product.slug}-catalog-empty`, kind: 'empty', alt: ''}
}

function resolveDetailMedia(
  product: WhatFitsProduct,
  section: ProductDetailSection | undefined,
): ResolvedMedia {
  if (section?.mediaImageUrl) {
    return {
      key: `${product.slug}-${section._key}-media-image`,
      kind: 'image',
      url: section.mediaImageUrl,
      alt: section.mediaAlt,
    }
  }

  if (section?.mediaUrl && isVideo(section.mediaType)) {
    return {
      key: `${product.slug}-${section._key}-media-video`,
      kind: 'video',
      url: section.mediaUrl,
      alt: section.mediaAlt,
    }
  }

  if (section?.imageUrl) {
    return {
      key: `${product.slug}-${section._key}-image`,
      kind: 'image',
      url: section.imageUrl,
      alt: section.title || product.detailTitle,
    }
  }

  if (product.detailMediaImageUrl) {
    return {
      key: `${product.slug}-detail-media-image`,
      kind: 'image',
      url: product.detailMediaImageUrl,
      alt: product.detailMediaAlt,
    }
  }

  if (product.detailMediaUrl && isVideo(product.detailMediaType)) {
    return {
      key: `${product.slug}-detail-media-video`,
      kind: 'video',
      url: product.detailMediaUrl,
      alt: product.detailMediaAlt,
    }
  }

  if (product.detailImageUrl) {
    return {
      key: `${product.slug}-detail-image`,
      kind: 'image',
      url: product.detailImageUrl,
      alt: product.detailTitle,
    }
  }

  if (product.catalogImageUrl) {
    return {
      key: `${product.slug}-catalog-image-fallback`,
      kind: 'image',
      url: product.catalogImageUrl,
      alt: product.catalogLabel,
    }
  }

  return {key: `${product.slug}-detail-empty`, kind: 'empty', alt: ''}
}

function MediaLayer({
  media,
  className,
  imageClassName,
}: {
  media: ResolvedMedia
  className: string
  imageClassName: string
}) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={media.key}
          className="absolute inset-0"
          initial={{opacity: 0, x: -10, scale: 0.992}}
          animate={{opacity: 1, x: 0, scale: 1}}
          exit={{opacity: 0, x: 8, scale: 0.996}}
          transition={{duration: 0.38, ease: [0.22, 1, 0.36, 1]}}
        >
          {media.kind === 'image' && media.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={media.alt} className={imageClassName} />
          ) : media.kind === 'video' && media.url ? (
            <video
              src={media.url}
              aria-label={media.alt || undefined}
              className={imageClassName}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function splitParagraphs(text?: string | null) {
  return (text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function normalizeTabValue(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isTechnicalDetailTab(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('technical') || value.includes('technisch')
}

function isOverviewDetailTab(tab: ProductDetailTab) {
  const value = `${normalizeTabValue(tab.key)} ${normalizeTabValue(tab.title)}`

  return value.includes('overview') || value.includes('uberblick')
}

export function WhatFitsScreen({
  customerType,
  initialProductSlug,
  headline,
  subline,
  products,
  bottomNavigation,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
  productNavigationLeftArrowUrl,
  productNavigationRightArrowUrl,
  productNavigationCatalogIconUrl,
}: WhatFitsScreenProps) {
  const initialProduct = products.find((product) => product.slug === initialProductSlug)
  const [view, setView] = useState<ProductView>(initialProduct ? 'detail' : 'catalog')
  const [selectedSlug, setSelectedSlug] = useState(initialProduct?.slug || products[0]?.slug || '')
  const selectedProduct = products.find((product) => product.slug === selectedSlug) || products[0]
  const [activeTabKey, setActiveTabKey] = useState(selectedProduct?.detailTabs[0]?.key || '')
  const activeTab =
    selectedProduct?.detailTabs.find((tab) => tab.key === activeTabKey) ||
    selectedProduct?.detailTabs[0]
  const isTechnicalTab = isTechnicalDetailTab(activeTab)
  const overviewTab =
    selectedProduct?.detailTabs.find(isOverviewDetailTab) || selectedProduct?.detailTabs[0]
  const [activeSectionKey, setActiveSectionKey] = useState(activeTab?.sections[0]?._key || '')
  const activeSection =
    activeTab?.sections.find((section) => section._key === activeSectionKey) || activeTab?.sections[0]
  const detailMediaSection = isTechnicalTab ? overviewTab?.sections[0] : activeSection
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const catalogMedia = useMemo(
    () => selectedProduct ? resolveCatalogMedia(selectedProduct) : {key: 'catalog-empty', kind: 'empty', alt: ''} as ResolvedMedia,
    [selectedProduct],
  )
  const detailMedia = useMemo(
    () => selectedProduct
      ? resolveDetailMedia(selectedProduct, detailMediaSection)
      : {key: 'detail-empty', kind: 'empty', alt: ''} as ResolvedMedia,
    [detailMediaSection, selectedProduct],
  )

  function selectProduct(slug: string, nextView: ProductView = view) {
    const product = products.find((item) => item.slug === slug)
    const firstTab = product?.detailTabs[0]

    setSelectedSlug(slug)
    setActiveTabKey(firstTab?.key || '')
    setActiveSectionKey(firstTab?.sections[0]?._key || '')
    setView(nextView)
  }

  function openProduct(slug: string) {
    selectProduct(slug, 'detail')
  }

  function selectTab(tabKey: string) {
    const tab = selectedProduct?.detailTabs.find((item) => item.key === tabKey)

    setActiveTabKey(tabKey)
    setActiveSectionKey(tab?.sections[0]?._key || '')
  }

  function handleBottomNavigation(item: ProductNavigationItem) {
    if (item.kind === 'catalog') {
      setView('catalog')
      return
    }

    if (item.kind === 'product' && item.slug) {
      openProduct(item.slug)
    }
  }

  const currentBottomIndex = bottomNavigation.findIndex((item) =>
    view === 'catalog'
      ? item.kind === 'catalog'
      : item.kind === 'product' && item.slug === selectedProduct?.slug,
  )
  const previousBottomItem = currentBottomIndex > 0 ? bottomNavigation[currentBottomIndex - 1] : undefined
  const nextBottomItem =
    currentBottomIndex >= 0 && currentBottomIndex < bottomNavigation.length - 1
      ? bottomNavigation[currentBottomIndex + 1]
      : undefined

  return (
    <PresentationViewport backgroundClassName="bg-[#3d4248]">
      <main className="relative isolate h-full w-full overflow-hidden bg-[#3d4248] font-sans text-white">
        {patternUrl ? (
          <span
            className={patternClassName}
            style={{backgroundImage: `url("${patternUrl}")`}}
            title={patternAlt || undefined}
            aria-hidden="true"
          />
        ) : null}

        <div className={brandLogoPositionClassName}>
          <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
            {pageLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pageLogoUrl} alt={logoAlt} className={brandLogoImageClassName} />
            ) : (
              <span className="text-[21px] font-bold uppercase tracking-[0.08em]">
                {logoAlt}
              </span>
            )}
          </Link>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {view === 'catalog' ? (
            <motion.section
              key="catalog"
              className="absolute inset-0 z-[2]"
              initial={{opacity: 0, x: -12}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -14}}
              transition={{duration: 0.36, ease: [0.22, 1, 0.36, 1]}}
              aria-labelledby="catalog-heading"
            >
              <MediaLayer
                media={catalogMedia}
                className="absolute bottom-[8px] left-[20px] h-[810px] w-[700px]"
                imageClassName="h-full w-full object-contain object-left-bottom"
              />

              <div className="absolute right-[60px] top-[270px] w-[650px]">
                {headline ? (
                  <h1
                    id="catalog-heading"
                    className="text-[50px] font-bold uppercase leading-none tracking-[0.045em] max-[1600px]:text-[56px] [@media(max-height:920px)]:text-[56px]"
                  >
                    {headline}
                  </h1>
                ) : null}

                {subline ? (
                  <p className="mt-[76px] border-b border-white/80 pb-[22px] text-[20px] font-bold uppercase tracking-[0.02em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]">
                    {subline}
                  </p>
                ) : null}

                <div className="mt-[44px] grid grid-cols-2 gap-x-[72px] gap-y-[34px]">
                  {products.map((product, index) => {
                    const isSelected = product.slug === selectedProduct?.slug

                    return (
                      <button
                        key={product._id}
                        type="button"
                        className={`group flex items-center gap-[28px] text-left text-[20px] font-bold uppercase tracking-[0.01em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px] ${
                          isSelected ? 'text-[#efb804]' : 'text-white'
                        }`}
                        aria-pressed={isSelected}
                        onClick={() => selectProduct(product.slug, 'catalog')}
                      >
                        <span className="relative grid h-[49px] w-[43px] shrink-0 place-items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/Vector%20(1).svg"
                            alt=""
                            className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                              isSelected ? '' : 'brightness-0 invert'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="relative text-[16px] font-medium">{index + 1}</span>
                        </span>
                        <span>{product.catalogLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedProduct?.catalogCtaLabel ? (
                <button
                  type="button"
                  className="group absolute bottom-[58px] right-[72px] z-[4] w-[246px] text-left font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]"
                  onClick={() => openProduct(selectedProduct.slug)}
                >
                  <span className="flex items-center justify-between pb-[10px]">
                    <span>{selectedProduct.catalogCtaLabel}</span>
                    <ArrowRight className="h-[14px] w-[20px] transition-transform group-hover:translate-x-1" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
                </button>
              ) : null}
            </motion.section>
          ) : selectedProduct ? (
            <motion.section
              key={`detail-${selectedProduct.slug}`}
              className="absolute inset-0 z-[2]"
              initial={{opacity: 0, x: 14}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 14}}
              transition={{duration: 0.36, ease: [0.22, 1, 0.36, 1]}}
              aria-labelledby="product-detail-heading"
            >
              <div className="absolute left-[60px] top-[225px] z-[3]">
                <h1
                  id="product-detail-heading"
                  className="text-[50px] font-bold uppercase leading-none tracking-[0.04em] max-[1600px]:text-[56px] [@media(max-height:920px)]:text-[56px]"
                >
                  {selectedProduct.detailTitle}
                </h1>

                <div className="mt-[42px] flex items-start gap-[10px]" role="tablist" aria-label={selectedProduct.detailTitle}>
                  {selectedProduct.detailTabs.map((tab) => {
                    const isActive = tab.key === activeTab?.key

                    return (
                      <button
                        key={tab._key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`relative px-[12px] pb-[9px] text-[16px] font-medium uppercase tracking-[0.01em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                          isActive ? 'text-[#efb804]' : 'text-white'
                        }`}
                        onClick={() => selectTab(tab.key)}
                      >
                        {tab.title}
                        {isActive ? (
                          <span className="absolute inset-x-0 bottom-0 h-px bg-[#efb804] opacity-100 shadow-none" aria-hidden="true" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <MediaLayer
                media={detailMedia}
                className="absolute bottom-0 left-0 h-[650px] w-[62cqw]"
                imageClassName="h-full w-full object-cover object-left-top"
              />

              <div
                className={`absolute left-[58.5cqw] right-[60px] z-[3] ${
                  isTechnicalTab ? 'top-[365px]' : 'top-[500px]'
                }`}
              >
                {isTechnicalTab && activeTab ? (
                  <div className="ml-auto w-[440px]">
                    {activeTab.sections.map((section) => {
                      const isActive = section._key === activeSection?._key
                      const contentId = `${section._key}-technical-content`

                      return (
                        <div
                          key={section._key}
                          className={isActive ? 'pb-[26px]' : 'border-b-2 border-white/90'}
                        >
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between gap-6 py-[20px] text-left font-sans text-[22px] font-bold uppercase leading-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:text-[24px] [@media(max-height:920px)]:text-[24px] ${
                              isActive ? 'text-[#efb804]' : 'text-white'
                            }`}
                            aria-expanded={isActive}
                            aria-controls={contentId}
                            onClick={() => setActiveSectionKey(section._key)}
                          >
                            <span>{section.title}</span>
                            <Hexagon
                              className="h-[21px] w-[21px] shrink-0"
                              strokeWidth={2.4}
                              aria-hidden="true"
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isActive ? (
                              <motion.div
                                id={contentId}
                                initial={{height: 0, opacity: 0, y: -8}}
                                animate={{height: 'auto', opacity: 1, y: 0}}
                                exit={{height: 0, opacity: 0, y: -8}}
                                transition={{duration: 0.4, ease: [0.22, 1, 0.36, 1]}}
                                className="overflow-hidden"
                              >
                                <div className="pb-[18px] pt-[24px]">
                                  {section.text ? (
                                    <div className="max-w-[420px] space-y-[22px] text-[18px] font-normal leading-[1.42] tracking-[0.025em] text-white/95 max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]">
                                      {splitParagraphs(section.text).map((paragraph, index) => (
                                        <p
                                          key={`${section._key}-paragraph-${index}`}
                                          className="whitespace-pre-line"
                                        >
                                          {paragraph}
                                        </p>
                                      ))}
                                    </div>
                                  ) : null}

                                  {section.specificationRows.length > 0 ? (
                                    <dl
                                      className={`space-y-[8px] text-[16px] leading-[1.35] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                                        section.text ? 'mt-[20px]' : ''
                                      }`}
                                    >
                                      {section.specificationRows.map((row, index) => (
                                        <div
                                          key={row._key || `${section._key}-row-${index}`}
                                          className="grid grid-cols-[minmax(0,1fr)_minmax(130px,0.7fr)] gap-[24px] border-b border-white/25 pb-[7px]"
                                        >
                                          <dt>{row.label}</dt>
                                          <dd className="font-bold">{row.value}</dd>
                                        </div>
                                      ))}
                                    </dl>
                                  ) : null}
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                ) : activeSection?.text ? (
                  <div className="space-y-[24px] text-[18px] font-normal leading-[1.45] tracking-[0.025em] text-white/95 max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]">
                    {splitParagraphs(activeSection.text).map((paragraph, index) => (
                      <p key={`${activeSection._key}-paragraph-${index}`} className="whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              {bottomNavigation.length > 0 ? (
                <nav
                  className="absolute bottom-[36px] left-[60px] z-[5] flex h-[48px] w-max items-center bg-[#464b50]"
                  aria-label="Produktnavigation"
                >
                  <span
                    className="pointer-events-none absolute -left-[25px] top-0 h-full w-[26px] bg-[#464b50] [clip-path:polygon(100%_0,100%_100%,0_50%)]"
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute -right-[25px] top-0 h-full w-[26px] bg-[#464b50] [clip-path:polygon(0_0,0_100%,100%_50%)]"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="absolute -left-[25px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] disabled:opacity-25"
                    onClick={() => previousBottomItem && handleBottomNavigation(previousBottomItem)}
                    disabled={!previousBottomItem || previousBottomItem.kind === 'screen'}
                    aria-label={previousBottomItem?.label || undefined}
                  >
                    {productNavigationLeftArrowUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productNavigationLeftArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" aria-hidden="true" />
                    ) : (
                      <ArrowLeft className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
                    )}
                  </button>

                  <div className="flex w-auto items-center justify-start gap-[44px] pl-[10px] pr-[12px]">
                    {bottomNavigation.map((item) => {
                      const isCatalog = item.kind === 'catalog'
                      const isActive = item.kind === 'product' && item.slug === selectedProduct.slug
                      const catalogIconUrl = item.iconUrl || productNavigationCatalogIconUrl
                      const commonClassName = `inline-flex items-center justify-center whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] max-[1600px]:text-[15px] [@media(max-height:920px)]:text-[15px] ${
                        isActive ? 'text-[#efb804]' : 'text-white'
                      } ${
                        isCatalog
                          ? catalogIconUrl
                            ? 'h-[26px] w-[66px] p-0 text-[#3d4248]'
                            : 'h-[26px] min-w-[66px] rounded-full bg-[#efb804] px-[12px] text-[#3d4248]'
                          : 'h-[34px] px-[12px]'
                      }`
                      const content = isCatalog ? (
                        <>
                          {catalogIconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={catalogIconUrl} alt="" className="h-[26px] w-[66px] object-contain" aria-hidden="true" />
                          ) : (
                            <ListFilter className="h-[17px] w-[17px]" strokeWidth={2.2} aria-hidden="true" />
                          )}
                          <span className="sr-only">{item.label}</span>
                        </>
                      ) : item.label

                      return item.kind === 'screen' && item.href ? (
                        <Link key={item.key} href={item.href} className={commonClassName}>
                          {content}
                        </Link>
                      ) : (
                        <button
                          key={item.key}
                          type="button"
                          className={commonClassName}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => handleBottomNavigation(item)}
                        >
                          {content}
                        </button>
                      )
                    })}
                  </div>

                  {nextBottomItem?.kind === 'screen' && nextBottomItem.href ? (
                    <Link
                      href={nextBottomItem.href}
                      className="absolute -right-[25px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804]"
                      aria-label={nextBottomItem.label}
                    >
                      {productNavigationRightArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={productNavigationRightArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="absolute -right-[25px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] disabled:opacity-25"
                      onClick={() => nextBottomItem && handleBottomNavigation(nextBottomItem)}
                      disabled={!nextBottomItem}
                      aria-label={nextBottomItem?.label || undefined}
                    >
                      {productNavigationRightArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={productNavigationRightArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
                      )}
                    </button>
                  )}
                </nav>
              ) : null}
            </motion.section>
          ) : null}
        </AnimatePresence>

        <ChapterNavigation
          customerType={customerType}
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
