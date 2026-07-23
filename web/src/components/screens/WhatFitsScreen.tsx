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
  ProductModel,
  ProductNavigationItem,
  WhatFitsProduct,
} from '@/lib/whatFits'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowLeft, ArrowRight, Hexagon, ListFilter} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useMemo, useState} from 'react'

type WhatFitsScreenProps = {
  customerType: CustomerGroup
  initialProductSlug?: string
  initialModelSlug?: string
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
  modelCardActivePatternUrl?: string
  modelCardInactivePatternUrl?: string
  catalogDetailPointActiveUrl?: string
  catalogDetailPointDarkUrl?: string
  catalogDetailPointInactiveUrl?: string
}

type ProductView = 'catalog' | 'detail'

type ResolvedMedia = {
  key: string
  kind: 'image' | 'video' | 'empty'
  url?: string
  alt: string
}

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'
const detailContentPanelClassName = 'ml-auto w-[470px]'

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

function isOverviewDetailTab(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('overview') || value.includes('uberblick')
}

function isTechnicalTabKey(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('technical') || value.includes('technisch')
}

function isFunctionsTab(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('functions') || value.includes('funktioniert')
}

function findTab(tabs: ProductDetailTab[] | undefined, key: string) {
  return tabs?.find((tab) => normalizeTabValue(tab.key) === key)
}

function isInterplayTab(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('interplay') || value.includes('zusammenspiel')
}

function isReferenceTab(tab?: ProductDetailTab) {
  const value = `${normalizeTabValue(tab?.key)} ${normalizeTabValue(tab?.title)}`

  return value.includes('reference') || value.includes('referenz')
}

function isEnergyCommunityProduct(product?: WhatFitsProduct) {
  const value = `${normalizeTabValue(product?.categoryType)} ${normalizeTabValue(product?.slug)} ${normalizeTabValue(product?.title)}`

  return (
    value.includes('energiegemeinschaft') ||
    value.includes('burgerenergiegemeinschaft') ||
    value.split(/\s+/).includes('beg')
  )
}

function hasTabSections(tab?: ProductDetailTab) {
  return Boolean(tab?.sections.length)
}

function resolveModelMedia(
  product: WhatFitsProduct,
  model: ProductModel | undefined,
  tab: ProductDetailTab | undefined,
  section: ProductDetailSection | undefined,
): ResolvedMedia {
  if (section?.mediaUrl && isVideo(section.mediaType)) {
    return {key: `${section._key}-model-section-video`, kind: 'video', url: section.mediaUrl, alt: section.mediaAlt}
  }

  if (section?.mediaImageUrl) {
    return {key: `${section._key}-model-section-media-image`, kind: 'image', url: section.mediaImageUrl, alt: section.mediaAlt}
  }

  if (section?.imageUrl) {
    return {key: `${section._key}-model-section-image`, kind: 'image', url: section.imageUrl, alt: section.title || model?.title || product.detailTitle}
  }

  const firstTabSection = tab?.sections.find((item) => item.mediaUrl || item.mediaImageUrl || item.imageUrl)

  if (firstTabSection && firstTabSection !== section) {
    return resolveModelMedia(product, model, tab, firstTabSection)
  }

  if (model?.imageUrl) {
    return {key: `${model._id}-model-image`, kind: 'image', url: model.imageUrl, alt: model.title}
  }

  if (model?.mediaUrl && isVideo(model.mediaType)) {
    return {key: `${model._id}-model-video`, kind: 'video', url: model.mediaUrl, alt: model.mediaAlt}
  }

  if (model?.mediaImageUrl) {
    return {key: `${model._id}-model-media-image`, kind: 'image', url: model.mediaImageUrl, alt: model.mediaAlt}
  }

  if (product.detailImageUrl) {
    return {key: `${product._id}-detail-image`, kind: 'image', url: product.detailImageUrl, alt: product.detailTitle}
  }

  if (product.catalogImageUrl) {
    return {key: `${product._id}-catalog-image`, kind: 'image', url: product.catalogImageUrl, alt: product.catalogLabel}
  }

  return {key: `${product._id}-model-empty`, kind: 'empty', alt: ''}
}

function buildNeedsHref(customerType: CustomerGroup, productSlug?: string, modelSlug?: string) {
  const params = new URLSearchParams({type: customerType})

  if (productSlug) {
    params.set('product', productSlug)
  }

  if (modelSlug) {
    params.set('model', modelSlug)
  }

  return `/needs?${params.toString()}`
}

function getBusinessCatalogOrder(product: WhatFitsProduct) {
  const value = `${normalizeTabValue(product.slug)} ${normalizeTabValue(product.catalogLabel)} ${normalizeTabValue(product.title)}`

  if (value.includes('photovoltaik') || value.includes('pv')) {
    return 1
  }

  if (value.includes('warmepumpe')) {
    return 2
  }

  if (value.includes('gewerbespeicher') || value.includes('speicher')) {
    return 3
  }

  if (value.includes('ladeinfrastruktur') || value.includes('laden')) {
    return 4
  }

  if (value.includes('energiegemeinschaft') || value.includes('beg')) {
    return 5
  }

  return 99
}

function getBusinessCatalogLabel(label: string) {
  return label
}

function getModelDisplayOrder(model: ProductModel) {
  if (typeof model.sortOrder === 'number') {
    return model.sortOrder
  }

  const value = normalizeTabValue(model.title)
  const order = [
    'bres-240-125',
    'bres-720-375',
    'bres-1040-500',
    'bres-1200-625',
    'bres-4160-2000',
    'bres-2400-1250',
    'bres-2080-1000',
  ]
  const index = order.findIndex((item) => value.includes(item))

  return index >= 0 ? index : Number.POSITIVE_INFINITY
}

export function WhatFitsScreen({
  customerType,
  initialProductSlug,
  initialModelSlug,
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
  modelCardActivePatternUrl,
  modelCardInactivePatternUrl,
  catalogDetailPointActiveUrl,
  catalogDetailPointDarkUrl,
  catalogDetailPointInactiveUrl,
}: WhatFitsScreenProps) {
  const router = useRouter()
  const initialProduct = products.find((product) => product.slug === initialProductSlug)
  const initialModel = initialProduct?.models.find(
    (model) => model.slug === initialModelSlug || model._id === initialModelSlug,
  )
  const [view, setView] = useState<ProductView>(initialProduct ? 'detail' : 'catalog')
  const [selectedSlug, setSelectedSlug] = useState(initialProduct?.slug || products[0]?.slug || '')
  const selectedProduct = products.find((product) => product.slug === selectedSlug) || products[0]
  const [selectedModelSlug, setSelectedModelSlug] = useState(initialModel?.slug || selectedProduct?.models[0]?.slug || '')
  const selectedModel =
    selectedProduct?.models.find((model) => model.slug === selectedModelSlug || model._id === selectedModelSlug) ||
    selectedProduct?.models[0]
  const firstModelTechnicalTab = selectedProduct?.models.map((model) => findTab(model.detailTabs, 'technical')).find(hasTabSections)
  const visibleTabs = selectedModel
    ? [
        findTab(selectedModel.detailTabs, 'overview'),
        findTab(selectedModel.detailTabs, 'technical') || firstModelTechnicalTab,
        findTab(selectedProduct?.detailTabs, 'interplay'),
        findTab(selectedProduct?.detailTabs, 'reference'),
      ].filter((tab): tab is ProductDetailTab => Boolean(tab))
    : selectedProduct?.detailTabs || []
  const [activeTabKey, setActiveTabKey] = useState(
    initialModel ? 'overview' : visibleTabs[0]?.key || '',
  )
  const activeTab = visibleTabs.find((tab) => tab.key === activeTabKey) || visibleTabs[0]
  const isTechnicalTab = isTechnicalTabKey(activeTab)
  const isFunctions = isFunctionsTab(activeTab)
  const isInterplay = isInterplayTab(activeTab)
  const isReference = isReferenceTab(activeTab)
  const isCompactSharedTab = isInterplay || isReference
  const isEnergyCommunity = isEnergyCommunityProduct(selectedProduct)
  const isEnergyCommunityOverview = isEnergyCommunity && isOverviewDetailTab(activeTab || visibleTabs[0])
  const overviewTab = visibleTabs.find(isOverviewDetailTab) || visibleTabs[0]
  const [activeSectionKey, setActiveSectionKey] = useState(activeTab?.sections[0]?._key || '')
  const activeSection =
    activeTab?.sections.find((section) => section._key === activeSectionKey) || activeTab?.sections[0]
  const hasStructuredTabContent = Boolean(
    activeTab?.contentTitle?.trim() ||
      activeTab?.introText?.trim() ||
      activeTab?.contentItemsTitle?.trim() ||
      activeTab?.contentItems.length ||
      (isEnergyCommunity && activeTab?.sections.length),
  )
  const energyCommunityOverviewBulletItems =
    isEnergyCommunityOverview && activeTab
      ? activeTab.contentItems.length > 0
        ? activeTab.contentItems
        : activeTab.sections
            .filter((section) => !section.title?.trim())
            .flatMap((section) =>
              section.specificationRows
                .map((row, index) => ({
                  _key: row._key || `${section._key}-spec-${index}`,
                  text: row.label?.trim() || row.value?.trim() || '',
                }))
                .filter((item) => item.text),
            )
      : activeTab?.contentItems || []
  const energyCommunityOverviewHintSections =
    isEnergyCommunityOverview && activeTab
      ? activeTab.sections.filter((section) => section.title?.trim())
      : []
  const energyCommunityOverviewIntroText =
    isEnergyCommunityOverview && activeTab
      ? activeTab.introText?.trim() ||
        activeTab.sections.find((section) => !section.title?.trim() && section.text?.trim())?.text?.trim()
      : activeTab?.introText?.trim()
  const detailMediaSection =
    selectedModel
      ? activeSection || activeTab?.sections[0] || overviewTab?.sections[0]
      : isTechnicalTab || isFunctions || hasStructuredTabContent ? overviewTab?.sections[0] : activeSection
  const isBusiness = customerType === 'b2b'
  const inactiveDetailPointUrl = isBusiness
    ? catalogDetailPointInactiveUrl
    : catalogDetailPointDarkUrl
  const inactiveDetailPointImageColorClass = isBusiness
    ? ''
    : '[filter:brightness(0)_saturate(100%)_invert(24%)_sepia(8%)_saturate(413%)_hue-rotate(176deg)_brightness(91%)_contrast(87%)]'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const catalogMedia = useMemo(
    () => selectedProduct ? resolveCatalogMedia(selectedProduct) : {key: 'catalog-empty', kind: 'empty', alt: ''} as ResolvedMedia,
    [selectedProduct],
  )
  const detailMedia = useMemo(
    () => selectedProduct
      ? selectedModel
        ? resolveModelMedia(selectedProduct, selectedModel, activeTab, detailMediaSection)
        : resolveDetailMedia(selectedProduct, detailMediaSection)
      : {key: 'detail-empty', kind: 'empty', alt: ''} as ResolvedMedia,
    [activeTab, detailMediaSection, selectedModel, selectedProduct],
  )
  const catalogProducts = useMemo(
    () =>
      isBusiness
        ? [...products].sort((a, b) => getBusinessCatalogOrder(a) - getBusinessCatalogOrder(b))
        : products,
    [isBusiness, products],
  )

  function selectProduct(slug: string, nextView: ProductView = view) {
    const product = products.find((item) => item.slug === slug)
    const firstTab = product?.detailTabs[0]

    setSelectedSlug(slug)
    setSelectedModelSlug(product?.models[0]?.slug || '')
    setActiveTabKey(product?.models.length ? 'overview' : firstTab?.key || '')
    setActiveSectionKey(firstTab?.sections[0]?._key || '')
    setView(nextView)
  }

  function openProduct(slug: string) {
    const product = products.find((item) => item.slug === slug)

    if (product?.models.length && product.models.length > 1) {
      setSelectedSlug(slug)
      setSelectedModelSlug(product.models[0]?.slug || '')
      setActiveTabKey('overview')
      setActiveSectionKey(findTab(product.models[0]?.detailTabs, 'overview')?.sections[0]?._key || '')
      setView('detail')
      router.push(buildNeedsHref(customerType, slug))
      return
    }

    selectProduct(slug, 'detail')
    router.push(buildNeedsHref(customerType, slug))
  }

  function openModel(product: WhatFitsProduct, model: ProductModel) {
    const overview = findTab(model.detailTabs, 'overview')

    setSelectedSlug(product.slug)
    setSelectedModelSlug(model.slug)
    setActiveTabKey('overview')
    setActiveSectionKey(overview?.sections[0]?._key || '')
    setView('detail')
    router.push(buildNeedsHref(customerType, product.slug, model.slug))
  }

  function selectTab(tabKey: string) {
    const tab = visibleTabs.find((item) => item.key === tabKey)

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
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#3d4248]' : 'bg-white'}>
      <main
        className={`relative isolate h-full w-full overflow-hidden font-sans ${
          isBusiness ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
        }`}
      >
        {patternUrl ? (
          <span
            className={`${patternClassName} ${
              isBusiness
                ? 'opacity-[0.065] [filter:brightness(0)_invert(1)]'
                : 'opacity-[0.86] mix-blend-normal [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]'
            }`}
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
                    className="font-sans text-[54px] font-bold uppercase leading-[0.92] tracking-[0.006em]"
                  >
                    {headline}
                  </h1>
                ) : null}

                {subline ? (
                  <p
                    className={`mt-[76px] border-b pb-[22px] text-[20px] font-bold uppercase tracking-[0.02em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px] ${
                      isBusiness ? 'border-white/80' : 'border-[#3d4248]/80'
                    }`}
                  >
                    {subline}
                  </p>
                ) : null}

                <div
                  className={`mt-[44px] grid grid-cols-2 gap-x-[72px] gap-y-[34px] ${
                    isBusiness ? 'grid-flow-col grid-rows-3' : ''
                  }`}
                >
                  {catalogProducts.map((product, index) => {
                    const isSelected = product.slug === selectedProduct?.slug
                    const catalogLabel = isBusiness
                      ? getBusinessCatalogLabel(product.catalogLabel)
                      : product.catalogLabel

                    return (
                      <button
                        key={product._id}
                        type="button"
                        className={`group flex items-center gap-[28px] text-left text-[17px] font-semibold uppercase leading-[1.16] tracking-[0.012em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${
                          isSelected
                            ? 'text-[#efb804]'
                            : isBusiness
                              ? 'text-white'
                              : 'text-[#3d4248]'
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
                              isSelected
                                ? ''
                                : isBusiness
                                  ? 'brightness-0 invert'
                                  : 'brightness-0 opacity-80'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="relative text-[16px] font-medium">{index + 1}</span>
                        </span>
                        <span>{catalogLabel}</span>
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
                  className="font-sans text-[54px] font-bold uppercase leading-[0.92] tracking-[0.006em]"
                >
                  {selectedProduct.detailTitle}
                </h1>

                <div className="mt-[42px] flex items-start gap-[10px]" role="tablist" aria-label={selectedProduct.detailTitle}>
                  {visibleTabs.map((tab) => {
                    const isActive = tab.key === activeTab?.key

                    return (
                      <button
                        key={tab._key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`relative px-[12px] pb-[9px] text-[16px] font-medium uppercase tracking-[0.01em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                          isActive
                            ? 'text-[#efb804]'
                            : isBusiness
                              ? 'text-white'
                              : 'text-[#3d4248]'
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
                className={
                  selectedModel && activeTab?.key === 'overview'
                    ? 'absolute bottom-[58px] left-[150px] h-[420px] w-[420px]'
                    : isTechnicalTab
                      ? 'absolute bottom-0 left-0 h-[650px] w-[62cqw]'
                    : 'absolute bottom-0 left-0 h-[650px] w-[62cqw]'
                }
                imageClassName={
                  selectedModel && activeTab?.key === 'overview'
                    ? 'h-full w-full object-contain object-center'
                    : isTechnicalTab
                      ? 'h-full w-full object-cover object-left-top'
                    : 'h-full w-full object-cover object-left-top'
                }
              />

              {!isBusiness ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 z-[2] h-[650px] w-[62cqw]"
                >
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-white" />
                  <span className="absolute inset-y-0 right-0 w-[4cqw] bg-white" />
                </div>
              ) : null}

              {selectedModel && activeTab?.key === 'overview' ? (
                <>
                  <div className="absolute bottom-[118px] left-[42px] z-[4] w-[165px] text-right text-white">
                    {selectedProduct.modelSeriesTitle ? (
                      <h2 className="text-[24px] font-bold uppercase leading-none tracking-[0.01em]">
                        {selectedProduct.modelSeriesTitle}
                      </h2>
                    ) : null}
                    <p className="mt-[8px] text-[15px] font-bold uppercase leading-none tracking-[0.01em]">
                      {selectedModel.title}
                    </p>
                  </div>

                  <div className="absolute bottom-[118px] left-[560px] z-[4] flex h-[450px] items-end gap-[22px]">
                    {[...selectedProduct.models].sort((a, b) => getModelDisplayOrder(a) - getModelDisplayOrder(b)).map((model) => {
                      const isActive = model.slug === selectedModel.slug
                      const modelCardTitle = model.cardTitle?.trim() || model.title
                      const cardPatternUrl = isActive
                        ? modelCardActivePatternUrl || model.selectionCardBackgroundUrl
                        : modelCardInactivePatternUrl || model.selectionCardBackground2Url || model.selectionCardBackgroundUrl

                      return (
                        <button
                          key={model._id}
                          type="button"
                          className={`relative h-[450px] w-[90px] overflow-hidden rounded-[12px] text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${
                            isActive ? 'bg-[#efb804] text-[#3d4248]' : 'bg-[#464b50] text-white'
                          }`}
                          aria-pressed={isActive}
                          onClick={() => openModel(selectedProduct, model)}
                        >
                          <span className="absolute left-1/2 top-1/2 z-[2] flex w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] items-center justify-start gap-[16px] whitespace-nowrap text-[20px] font-bold uppercase tracking-[0.03em]">
                            {model.seriesLabel ? <span className="font-normal">{model.seriesLabel}</span> : null}
                            <span aria-hidden="true">|</span>
                            <span>{modelCardTitle}</span>
                          </span>
                          {cardPatternUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cardPatternUrl}
                              alt=""
                              className="pointer-events-none absolute bottom-0 right-0 z-[1] h-[92px] w-[72px] object-contain object-right-bottom"
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className={`absolute bottom-0 right-0 z-[1] h-[78px] w-[58px] ${
                                isActive ? 'bg-[#3d4248]' : 'bg-white'
                              } [clip-path:polygon(100%_0,100%_100%,0_100%,0_48%)]`}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}

              <div
                className={`absolute left-[58.5cqw] right-[60px] z-[3] ${
                  selectedModel && activeTab?.key === 'overview'
                    ? 'top-[820px]'
                    : isTechnicalTab || isFunctions || isCompactSharedTab || isEnergyCommunityOverview || hasStructuredTabContent
                      ? 'top-[330px]'
                      : 'top-[500px]'
                }`}
              >
                {(isTechnicalTab || isFunctions) && activeTab ? (
                  <div className={detailContentPanelClassName}>
                    {activeTab.sections.map((section) => {
                      const isActive = section._key === activeSection?._key
                      const contentId = `${section._key}-technical-content`

                      return (
                        <div
                          key={section._key}
                          className={
                            isActive
                              ? 'pb-[34px]'
                              : `border-b-2 ${isBusiness ? 'border-white/90' : 'border-[#3d4248]/80'}`
                          }
                        >
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between gap-6 py-[16px] text-left font-sans text-[18px] font-bold uppercase leading-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px] ${
                              isActive
                                ? 'text-[#efb804]'
                                : isBusiness
                                  ? 'text-white'
                                  : 'text-[#3d4248]'
                            }`}
                            aria-expanded={isActive}
                            aria-controls={contentId}
                            onClick={() => setActiveSectionKey(section._key)}
                          >
                            <span>{section.title}</span>
                            {isActive && catalogDetailPointActiveUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={catalogDetailPointActiveUrl}
                                alt=""
                                className="h-[21px] w-[21px] shrink-0 object-contain"
                                aria-hidden="true"
                              />
                            ) : !isActive && inactiveDetailPointUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inactiveDetailPointUrl}
                                alt=""
                                className={`h-[21px] w-[21px] shrink-0 object-contain ${inactiveDetailPointImageColorClass}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <Hexagon
                                className={`h-[21px] w-[21px] shrink-0 ${
                                  isActive ? 'text-[#efb804]' : isBusiness ? 'text-white' : 'text-[#3d4248]'
                                }`}
                                strokeWidth={2.4}
                                aria-hidden="true"
                              />
                            )}
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
                                <div className="pb-[18px] pt-[28px]">
                                  {section.text ? (
                                    <div
                                      className={`${isFunctions ? 'w-full max-w-none text-[18px]' : 'max-w-[420px] text-[18px] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]'} space-y-[22px] font-normal leading-[1.42] tracking-[0.025em] ${
                                        isBusiness ? 'text-white/95' : 'text-[#3d4248]/95'
                                      }`}
                                    >
                                      {isFunctions ? (
                                        <p>
                                          {splitParagraphs(section.text).join(' ').replace(/\s+/g, ' ')}
                                        </p>
                                      ) : (
                                        splitParagraphs(section.text).map((paragraph, index) => (
                                          <p
                                            key={`${section._key}-paragraph-${index}`}
                                            className="whitespace-pre-line"
                                          >
                                            {paragraph}
                                          </p>
                                        ))
                                      )}
                                    </div>
                                  ) : null}

                                  {section.specificationRows.length > 0 ? (
                                    <dl
                                      className={`space-y-[8px] text-[16px] leading-[1.32] tracking-[0.01em] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                                        section.text ? 'mt-[20px]' : ''
                                      }`}
                                    >
                                      {section.specificationRows.map((row, index) => (
                                        <div
                                          key={row._key || `${section._key}-row-${index}`}
                                          className="grid grid-cols-[minmax(0,1fr)_minmax(150px,0.75fr)] gap-[24px]"
                                        >
                                          <dt>{row.label}</dt>
                                          <dd className="text-right font-bold">{row.value}</dd>
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
                ) : hasStructuredTabContent && activeTab ? (
                  <div className={detailContentPanelClassName}>
                    {activeTab.contentTitle?.trim() ? (
                      <h2
                        className={`mb-[28px] uppercase leading-[1.08] tracking-[0.01em] ${
                          isReference
                            ? 'text-[22px] font-semibold'
                            : isEnergyCommunityOverview
                              ? 'text-[24px] font-bold'
                            : isCompactSharedTab
                              ? 'text-[20px] font-bold'
                              : 'text-[24px] font-bold'
                        } ${
                          isBusiness ? 'text-white' : 'text-[#3d4248]'
                        }`}
                      >
                        {activeTab.contentTitle.trim()}
                      </h2>
                    ) : null}

                    {energyCommunityOverviewIntroText ? (
                      <div
                        className={`max-w-[520px] whitespace-pre-line tracking-[0.01em] ${
                          isReference
                            ? 'text-[17px] font-normal leading-[1.45]'
                            : isEnergyCommunityOverview
                              ? 'text-[22px] font-normal leading-[1.28]'
                            : isCompactSharedTab
                              ? 'text-[20px] font-semibold leading-[1.32] [@media(max-height:800px)]:text-[16px]'
                              : 'text-[21px] font-semibold leading-[1.35]'
                        } ${
                          isBusiness ? 'text-white' : 'text-[#3d4248]'
                        }`}
                      >
                        {energyCommunityOverviewIntroText}
                      </div>
                    ) : null}

                    {activeTab.contentItemsTitle?.trim() ? (
                      <h3
                        className={`${isReference ? 'mt-[38px]' : 'mt-[44px]'} font-bold uppercase leading-none tracking-[0.01em] ${
                          isEnergyCommunityOverview ? 'text-[22px]' : isCompactSharedTab ? 'text-[20px]' : 'text-[22px]'
                        } ${
                          isBusiness ? 'text-white' : 'text-[#3d4248]'
                        }`}
                      >
                        {activeTab.contentItemsTitle.trim()}
                      </h3>
                    ) : null}

                    {(isEnergyCommunityOverview ? energyCommunityOverviewBulletItems.length : activeTab.contentItems.length) > 0 ? (
                      <div className={`${energyCommunityOverviewIntroText || activeTab.contentItemsTitle?.trim() ? (isReference ? 'mt-[28px]' : isEnergyCommunityOverview ? 'mt-[28px]' : isCompactSharedTab ? 'mt-[34px]' : 'mt-[42px]') : ''} ${isEnergyCommunityOverview ? 'space-y-[5px]' : isCompactSharedTab ? 'space-y-[18px]' : 'space-y-[24px]'}`}>
                        {(isEnergyCommunityOverview ? energyCommunityOverviewBulletItems : activeTab.contentItems).map((item) => (
                          <div key={item._key} className={`${isEnergyCommunityOverview ? 'grid-cols-[14px_minmax(0,1fr)] gap-[14px]' : isCompactSharedTab ? 'grid-cols-[16px_minmax(0,1fr)] gap-[14px]' : 'grid-cols-[22px_minmax(0,1fr)] gap-[20px]'} grid`}>
                            {isEnergyCommunityOverview ? (
                              <span
                                className={`mt-[14px] h-[4px] w-[4px] rounded-full ${
                                  isBusiness ? 'bg-white' : 'bg-[#3d4248]'
                                }`}
                                aria-hidden="true"
                              />
                            ) : isCompactSharedTab && inactiveDetailPointUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inactiveDetailPointUrl}
                                alt=""
                                className={`mt-[5px] h-[13px] w-[13px] shrink-0 object-contain ${inactiveDetailPointImageColorClass}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <Hexagon
                                className={`${isCompactSharedTab ? 'mt-[5px] h-[13px] w-[13px]' : 'mt-[2px] h-[18px] w-[18px]'} shrink-0 ${
                                  isBusiness ? 'text-white' : 'text-[#3d4248]'
                                }`}
                                strokeWidth={2.3}
                                aria-hidden="true"
                              />
                            )}
                            <div
                              className={`font-normal tracking-[0.01em] ${
                                isEnergyCommunityOverview ? 'text-[21px] leading-[1.35]' : isCompactSharedTab ? 'text-[17px] leading-[1.34]' : 'text-[18px] leading-[1.42]'
                              } ${
                                isBusiness ? 'text-white/95' : 'text-[#3d4248]/95'
                              }`}
                            >
                              {isReference ? (
                                <>
                                  {item.text?.trim() ? (
                                    <span>
                                      {item.text.trim()}
                                    </span>
                                  ) : null}
                                  {item.title?.trim() ? (
                                    <strong className={`font-bold ${item.text?.trim() ? 'ml-[5px]' : ''}`}>
                                      {item.title.trim()}
                                    </strong>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  {item.title?.trim() ? (
                                    <strong className={`font-bold ${isInterplay ? 'mb-[2px] block uppercase' : ''}`}>{item.title.trim()}</strong>
                                  ) : null}
                                  {item.text?.trim() ? (
                                    <span className={isInterplay ? 'block' : item.title?.trim() ? 'ml-[5px]' : ''}>
                                      {item.text.trim()}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {isEnergyCommunityOverview && energyCommunityOverviewHintSections.length > 0 ? (
                      <div className="mt-[48px] space-y-[30px]">
                        {energyCommunityOverviewHintSections.map((section) => (
                          <div key={section._key} className="grid grid-cols-[7px_minmax(0,1fr)] gap-[24px]">
                            <span
                              className={`h-full min-h-[92px] w-[5px] bg-[repeating-linear-gradient(115deg,transparent_0,transparent_4px,currentColor_4px,currentColor_6px)] ${
                                isBusiness ? 'text-white' : 'text-[#3d4248]'
                              }`}
                              aria-hidden="true"
                            />
                            <div>
                              {section.title?.trim() ? (
                                <h3 className="text-[21px] font-bold uppercase leading-none tracking-[0.01em]">
                                  {section.title.trim()}
                                </h3>
                              ) : null}
                              {section.text?.trim() ? (
                                <div className={`mt-[16px] space-y-[12px] text-[21px] font-normal leading-[1.28] tracking-[0.01em] ${
                                  isBusiness ? 'text-white/95' : 'text-[#3d4248]/95'
                                }`}>
                                  {splitParagraphs(section.text).map((paragraph, index) => (
                                    <p key={`${section._key}-paragraph-${index}`} className="whitespace-pre-line">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : activeSection?.text ? (
                  <div
                    className={`${detailContentPanelClassName} space-y-[24px] text-[18px] font-normal leading-[1.45] tracking-[0.025em] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px] ${
                      isBusiness ? 'text-white/95' : 'text-[#3d4248]/95'
                    }`}
                  >
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

                  <div className="flex w-auto items-center justify-start gap-[40px] pl-[10px] pr-[12px]">
                    {bottomNavigation.map((item) => {
                      const isCatalog = item.kind === 'catalog'
                      const isActive = item.kind === 'product' && item.slug === selectedProduct.slug
                      const catalogIconUrl = productNavigationCatalogIconUrl || item.iconUrl
                      const commonClassName = `inline-flex items-center justify-center whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] max-[1600px]:text-[15px] [@media(max-height:920px)]:text-[15px] ${
                        isActive && !isCatalog ? 'rounded-full bg-[#efb804] text-[#3d4248]' : 'text-white'
                        } ${
                        isCatalog
                          ? catalogIconUrl
                            ? 'h-[26px] w-[66px] p-0 leading-none'
                            : 'h-[26px] min-w-[66px] rounded-full bg-white px-[12px] text-[#3d4248]'
                          : 'h-[26px] px-[12px]'
                      }`
                      const content = isCatalog ? (
                        <>
                          {catalogIconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={catalogIconUrl} alt="" className="block h-[26px] w-[66px] shrink-0 object-contain" aria-hidden="true" />
                          ) : (
                            <ListFilter className="h-[17px] w-[17px] text-[#3d4248]" strokeWidth={2.2} aria-hidden="true" />
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
