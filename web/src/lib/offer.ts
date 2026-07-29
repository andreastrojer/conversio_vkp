import {getAboutPageData, type ChapterNavigationItem} from '@/lib/about'
import {buildImageUrl, buildLogoUrl, type SanityImage} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {B2C_PRODUCT_DETAILS_QUERY, OFFER_SCREEN_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

type OfferMedia = {
  title?: string | null
  altText?: string | null
  mediaType?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  image?: SanityImage
} | null

export type OfferSection = {
  _key?: string | null
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  visibleFor?: string | null
  layout?: string | null
  sortOrder?: number | null
  image?: SanityImage
  media?: OfferMedia
  cta?: {
    label?: string | null
    target?: string | null
    style?: string | null
    image?: SanityImage
  } | null
  imageUrl?: string
  mediaImageUrl?: string
  mediaUrl?: string
  mediaType?: string | null
  mediaAlt?: string
}

type B2cFunctionStepDocument = {
  _key?: string | null
  stepNumber?: number | null
  title?: string | null
  text?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
}

type B2cDetailSectionDocument = {
  _key?: string | null
  title?: string | null
  stepNumber?: number | null
  text?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
}

type B2cDetailTabDocument = {
  _key?: string | null
  title?: string | null
  key?: string | null
  isActive?: boolean | null
  contentTitle?: string | null
  introText?: string | null
  contentItemsTitle?: string | null
  contentItems?: Array<{
    _key?: string | null
    title?: string | null
    text?: string | null
    isActive?: boolean | null
  }> | null
  functionSteps?: B2cFunctionStepDocument[] | null
  functionNavigation?: {
    visibleSteps?: number | null
    stepMarkerMedia?: OfferMedia
    upArrowMedia?: OfferMedia
    downArrowMedia?: OfferMedia
  } | null
  sections?: B2cDetailSectionDocument[] | null
}

type B2cProductDocument = {
  _id?: string | null
  title?: string | null
  slug?: string | null
  targetGroup?: string | null
  isActive?: boolean | null
  detailTitle?: string | null
  navigationLabel?: string | null
  b2cDetailConfig?: {
    isEnabled?: boolean | null
    overlayOpacity?: number | null
    backgroundMedia?: OfferMedia
    processMarkerMedia?: OfferMedia
    benefitMarkerMedia?: OfferMedia
  } | null
  detailTabs?: B2cDetailTabDocument[] | null
}

type B2cHouseConfigDocument = {
  backgroundMedia?: OfferMedia
  defaultHotspotMedia?: OfferMedia
  hotspots?: Array<{
    _key?: string | null
    label?: string | null
    xPercent?: number | null
    yPercent?: number | null
    sortOrder?: number | null
    isActive?: boolean | null
    media?: OfferMedia
    product?: B2cProductDocument | null
  }> | null
} | null

type B2cNavigationItemDocument = {
  _key?: string | null
  itemType?: string | null
  label?: string | null
  screenKey?: string | null
  product?: {
    _id?: string | null
    title?: string | null
    slug?: string | null
    navigationLabel?: string | null
    targetGroup?: string | null
    isActive?: boolean | null
  } | null
}

type OfferScreenDocument = {
  title?: string | null
  screenKey?: string | null
  screenType?: string | null
  purpose?: string | null
  targetAudience?: string | null
  headline?: string | null
  subline?: string | null
  isActive?: boolean | null
  heroImage?: SanityImage
  heroMedia?: OfferMedia
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  sections?: OfferSection[] | null
  b2cHouseConfig?: B2cHouseConfigDocument
  hotspotExpandedMedia?: OfferMedia
  interplayMarkerMedia?: OfferMedia
  productBottomNavigation?: B2cNavigationItemDocument[] | null
  productNavigationAssets?: Array<{
    title?: string | null
    image?: SanityImage
  }> | null
} | null

export type B2cMedia = {
  imageUrl?: string
  mediaUrl?: string
  mediaType?: string | null
  alt: string
}

export type B2cDetailSection = {
  _key: string
  title?: string | null
  stepNumber?: number | null
  text?: string | null
  sortOrder?: number | null
}

export type B2cFunctionStep = {
  _key: string
  stepNumber: number
  title: string
  text: string
  sortOrder?: number | null
}

export type B2cDetailContentItem = {
  _key: string
  title?: string | null
  text?: string | null
}

export type B2cDetailTab = {
  _key: string
  title: string
  key: 'overview' | 'functions' | 'interplay'
  contentTitle?: string | null
  introText?: string | null
  contentItemsTitle?: string | null
  contentItems: B2cDetailContentItem[]
  functionSteps: B2cFunctionStep[]
  functionNavigation?: {
    visibleSteps?: number | null
    stepMarkerMedia?: B2cMedia
    upArrowMedia?: B2cMedia
    downArrowMedia?: B2cMedia
  }
  sections: B2cDetailSection[]
}

export type B2cProduct = {
  _id: string
  title: string
  slug: string
  detailTitle: string
  navigationLabel: string
  overlayOpacity: number
  backgroundMedia: B2cMedia
  processMarkerMedia?: B2cMedia
  benefitMarkerMedia?: B2cMedia
  detailTabs: B2cDetailTab[]
}

export type B2cHouseHotspot = {
  _key: string
  label: string
  xPercent: number
  yPercent: number
  sortOrder?: number | null
  media?: B2cMedia
  product: B2cProduct
}

export type B2cHouseConfig = {
  backgroundMedia: B2cMedia
  defaultHotspotMedia?: B2cMedia
  expandedHotspotMedia?: B2cMedia
  hotspots: B2cHouseHotspot[]
}

export type B2cNavigationItem = {
  key: string
  label: string
  kind: 'catalog' | 'product' | 'screen'
  slug?: string
  href?: string
  iconUrl?: string
}

export type OfferPageData = {
  headline?: string | null
  subline?: string | null
  sections: OfferSection[]
  heroImageUrl?: string
  heroMediaImageUrl?: string
  heroMediaUrl?: string
  heroMediaType?: string | null
  heroMediaAlt?: string
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
  navigationArrowUrl?: string
  b2cHouseConfig?: B2cHouseConfig
  b2cProducts: B2cProduct[]
  b2cNavigationItems: B2cNavigationItem[]
  productNavigationLeftArrowUrl?: string
  productNavigationRightArrowUrl?: string
  productNavigationCatalogIconUrl?: string
  productNavigationCatalogActiveIconUrl?: string
}

const offerClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function sortSections(a: OfferSection, b: OfferSection) {
  const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY
  const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY

  return aOrder - bOrder
}

function resolveMediaUrl(media: OfferMedia | undefined) {
  return media?.fileUrl || media?.externalUrl || undefined
}

function resolveImageUrl(image: SanityImage | undefined, width = 3200) {
  return buildImageUrl(image, width, undefined, 100) || buildLogoUrl(image)
}

function normalizeB2cMedia(
  media: OfferMedia | undefined,
  fallbackAlt: string,
  width = 3200,
): B2cMedia | undefined {
  if (!media) {
    return undefined
  }

  const imageUrl = resolveImageUrl(media.image, width)
  const mediaUrl = resolveMediaUrl(media)

  if (!imageUrl && !mediaUrl) {
    return undefined
  }

  return {
    imageUrl,
    mediaUrl,
    mediaType: media.mediaType,
    alt: media.altText?.trim() || media.title?.trim() || fallbackAlt,
  }
}

function normalizeB2cDetailTabs(tabs: B2cDetailTabDocument[] | null | undefined) {
  const allowedKeys = new Set<B2cDetailTab['key']>(['overview', 'functions', 'interplay'])

  return (tabs || []).flatMap<B2cDetailTab>((tab) => {
    const key = tab.key?.trim()

    if (
      !tab._key ||
      !tab.title?.trim() ||
      !key ||
      !allowedKeys.has(key as B2cDetailTab['key']) ||
      tab.isActive === false
    ) {
      return []
    }

    const functionSteps = (tab.functionSteps || [])
      .filter(
        (step): step is B2cFunctionStepDocument & {
          _key: string
          stepNumber: number
          title: string
          text: string
        } =>
          Boolean(
            step._key &&
              typeof step.stepNumber === 'number' &&
              step.title?.trim() &&
              step.text?.trim() &&
              step.isActive !== false,
          ),
      )
      .sort((first, second) => {
        const firstOrder =
          typeof first.sortOrder === 'number' ? first.sortOrder : Number.POSITIVE_INFINITY
        const secondOrder =
          typeof second.sortOrder === 'number' ? second.sortOrder : Number.POSITIVE_INFINITY

        return firstOrder - secondOrder || first.stepNumber - second.stepNumber
      })
      .map((step) => ({
        _key: step._key,
        stepNumber: step.stepNumber,
        title: step.title.trim(),
        text: step.text.trim(),
        sortOrder: step.sortOrder,
      }))

    const sections = (tab.sections || [])
      .filter(
        (section): section is B2cDetailSectionDocument & {_key: string} =>
          Boolean(
            section._key &&
              section.isActive !== false &&
              (section.title?.trim() || section.text?.trim()),
          ),
      )
      .sort((first, second) => {
        const firstOrder =
          typeof first.sortOrder === 'number' ? first.sortOrder : Number.POSITIVE_INFINITY
        const secondOrder =
          typeof second.sortOrder === 'number' ? second.sortOrder : Number.POSITIVE_INFINITY

        return firstOrder - secondOrder
      })
      .map((section) => ({
        _key: section._key,
        title: section.title?.trim() || null,
        stepNumber: section.stepNumber,
        text: section.text?.trim() || null,
        sortOrder: section.sortOrder,
      }))

    return [{
      _key: tab._key,
      title: tab.title.trim(),
      key: key as B2cDetailTab['key'],
      contentTitle: tab.contentTitle?.trim() || null,
      introText: tab.introText?.trim() || null,
      contentItemsTitle: tab.contentItemsTitle?.trim() || null,
      contentItems: (tab.contentItems || [])
        .filter(
          (item): item is NonNullable<B2cDetailTabDocument['contentItems']>[number] & {
            _key: string
          } =>
            Boolean(
              item._key &&
                item.isActive !== false &&
                (item.title?.trim() || item.text?.trim()),
            ),
        )
        .map((item) => ({
          _key: item._key,
          title: item.title?.trim() || null,
          text: item.text?.trim() || null,
        })),
      functionSteps,
      functionNavigation: tab.functionNavigation
        ? {
            visibleSteps: tab.functionNavigation.visibleSteps,
            stepMarkerMedia: normalizeB2cMedia(
              tab.functionNavigation.stepMarkerMedia,
              tab.title,
              320,
            ),
            upArrowMedia: normalizeB2cMedia(
              tab.functionNavigation.upArrowMedia,
              tab.title,
              160,
            ),
            downArrowMedia: normalizeB2cMedia(
              tab.functionNavigation.downArrowMedia,
              tab.title,
              160,
            ),
          }
        : undefined,
      sections,
    }]
  })
}

function normalizeB2cProduct(
  product: B2cProductDocument | null | undefined,
  fallbackBenefitMarkerMedia?: B2cMedia,
) {
  const isB2cProduct = product?.targetGroup === 'b2c' || product?.targetGroup === 'both'
  const detailConfig = product?.b2cDetailConfig
  const backgroundMedia = normalizeB2cMedia(
    detailConfig?.backgroundMedia,
    product?.detailTitle?.trim() || product?.title?.trim() || '',
  )

  if (
    !product?._id ||
    !product.title?.trim() ||
    !product.slug?.trim() ||
    product.isActive === false ||
    !isB2cProduct ||
    detailConfig?.isEnabled !== true ||
    !backgroundMedia
  ) {
    return undefined
  }

  const detailTabs = normalizeB2cDetailTabs(product.detailTabs)
  const hasOverview = detailTabs.some((tab) => tab.key === 'overview' && tab.sections.length > 0)
  const hasFunctions = detailTabs.some(
    (tab) => tab.key === 'functions' && tab.functionSteps.length > 0,
  )
  const hasInterplay = detailTabs.some(
    (tab) =>
      tab.key === 'interplay' &&
      Boolean(tab.contentTitle && tab.introText && tab.contentItems.length > 0),
  )

  if (!hasOverview || !hasFunctions || !hasInterplay) {
    return undefined
  }

  const overlayOpacity =
    typeof detailConfig.overlayOpacity === 'number'
      ? Math.min(100, Math.max(0, detailConfig.overlayOpacity))
      : 0

  return {
    _id: product._id,
    title: product.title.trim(),
    slug: product.slug.trim(),
    detailTitle: product.detailTitle?.trim() || product.title.trim(),
    navigationLabel: product.navigationLabel?.trim() || product.title.trim(),
    overlayOpacity,
    backgroundMedia,
    processMarkerMedia: normalizeB2cMedia(
      detailConfig.processMarkerMedia,
      product.title,
      320,
    ),
    benefitMarkerMedia: normalizeB2cMedia(
      detailConfig.benefitMarkerMedia,
      product.title,
      320,
    ) || fallbackBenefitMarkerMedia,
    detailTabs,
  } satisfies B2cProduct
}

function normalizeB2cHouseConfig(
  config: B2cHouseConfigDocument | undefined,
  productsById: Map<string, B2cProduct>,
  expandedHotspotMediaDocument?: OfferMedia,
): B2cHouseConfig | undefined {
  const backgroundMedia = normalizeB2cMedia(config?.backgroundMedia, '')

  if (!config || !backgroundMedia) {
    return undefined
  }

  const defaultHotspotMedia = normalizeB2cMedia(config.defaultHotspotMedia, '', 320)
  const expandedHotspotMedia = normalizeB2cMedia(
    expandedHotspotMediaDocument,
    '',
    320,
  )
  const hotspots = (config.hotspots || []).flatMap<B2cHouseHotspot>((hotspot) => {
    const product = hotspot.product?._id
      ? productsById.get(hotspot.product._id)
      : undefined
    const xPercent = hotspot.xPercent
    const yPercent = hotspot.yPercent

    if (
      !hotspot._key ||
      !hotspot.label?.trim() ||
      hotspot.isActive === false ||
      !product ||
      typeof xPercent !== 'number' ||
      xPercent < 0 ||
      xPercent > 100 ||
      typeof yPercent !== 'number' ||
      yPercent < 0 ||
      yPercent > 100
    ) {
      return []
    }

    return [{
      _key: hotspot._key,
      label: hotspot.label.trim(),
      xPercent,
      yPercent,
      sortOrder: hotspot.sortOrder,
      media: normalizeB2cMedia(hotspot.media, hotspot.label, 320) || defaultHotspotMedia,
      product,
    }]
  })

  return {
    backgroundMedia,
    defaultHotspotMedia,
    expandedHotspotMedia,
    hotspots,
  }
}

function normalizeB2cNavigationItems(
  items: B2cNavigationItemDocument[] | null | undefined,
  productsById: Map<string, B2cProduct>,
): B2cNavigationItem[] {
  return (items || []).flatMap<B2cNavigationItem>((item) => {
    if (!item._key) {
      return []
    }

    if (item.itemType === 'product' && item.product?._id) {
      const product = productsById.get(item.product._id)

      if (!product) {
        return []
      }

      return [{
        key: item._key,
        label: item.label?.trim() || product.navigationLabel,
        kind: 'product',
        slug: product.slug,
      }]
    }

    const screenKey = item.screenKey?.trim()
    const label = item.label?.trim()

    if (item.itemType === 'screen' && screenKey && label) {
      return [{
        key: item._key,
        label,
        kind: 'screen',
        href: screenKey.startsWith('/') ? screenKey : `/${screenKey}?type=b2c`,
      }]
    }

    return []
  })
}

export async function getOfferPageData(
  customerType: CustomerGroup,
  screenType: 'offer' | 'whatfits' = 'offer',
): Promise<OfferPageData> {
  const sharedContentPromise = getAboutPageData(customerType)
  const b2cProductsPromise: Promise<B2cProductDocument[]> =
    customerType === 'b2c' && screenType === 'whatfits'
      ? offerClient.fetch<B2cProductDocument[]>(
          B2C_PRODUCT_DETAILS_QUERY,
          {},
          freshFetchOptions,
        )
      : Promise.resolve([])

  try {
    const [screen, b2cProductDocuments, sharedContent] = await Promise.all([
      offerClient.fetch<OfferScreenDocument>(
        OFFER_SCREEN_QUERY,
        {customerType, screenType},
        freshFetchOptions,
      ),
      b2cProductsPromise,
      sharedContentPromise,
    ])

    const sections = (screen?.sections || []).sort(sortSections)
      .map((section) => ({
        ...section,
        imageUrl: buildImageUrl(section.image, 2400, undefined, 100),
        mediaImageUrl: buildImageUrl(section.media?.image, 2400, undefined, 100),
        mediaUrl: resolveMediaUrl(section.media),
        mediaType: section.media?.mediaType,
        mediaAlt: section.media?.altText || section.media?.title || section.title || '',
        cta: section.cta
          ? {
              ...section.cta,
              image: section.cta.image,
              imageUrl:
                buildLogoUrl(section.cta.image) ||
                buildImageUrl(section.cta.image, 96, undefined, 100),
            }
          : null,
      }))
    const fallbackBenefitMarkerMedia = normalizeB2cMedia(
      screen?.interplayMarkerMedia,
      '',
      64,
    )
    const b2cProducts =
      customerType === 'b2c'
        ? b2cProductDocuments.flatMap<B2cProduct>((product) => {
            const normalizedProduct = normalizeB2cProduct(
              product,
              fallbackBenefitMarkerMedia,
            )

            return normalizedProduct ? [normalizedProduct] : []
          })
        : []
    const b2cProductsById = new Map(
      b2cProducts.map((product) => [product._id, product]),
    )
    const b2cHouseConfig =
      customerType === 'b2c'
        ? normalizeB2cHouseConfig(
            screen?.b2cHouseConfig,
            b2cProductsById,
            screen?.hotspotExpandedMedia,
          )
        : undefined
    const navigationAssetUrl = (title: string) =>
      resolveImageUrl(
        screen?.productNavigationAssets?.find((asset) => asset.title?.trim() === title)?.image,
        256,
      )

    return {
      headline: screen?.headline,
      subline: screen?.subline,
      sections,
      heroImageUrl: buildImageUrl(screen?.heroImage, 2400, undefined, 100),
      heroMediaImageUrl: buildImageUrl(screen?.heroMedia?.image, 2400, undefined, 100),
      heroMediaUrl: resolveMediaUrl(screen?.heroMedia),
      heroMediaType: screen?.heroMedia?.mediaType,
      heroMediaAlt: screen?.heroMedia?.altText || screen?.heroMedia?.title || '',
      primaryCta: screen?.primaryCta,
      navigationItems: sharedContent.navigationItems.map((item) => ({
        ...item,
        href:
          item.key === 'about'
            ? `/about?type=${customerType}`
            : item.key === 'offer'
              ? `/offer?type=${customerType}`
              : item.href,
      })),
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
      b2cHouseConfig,
      b2cProducts,
      b2cNavigationItems:
        customerType === 'b2c'
          ? normalizeB2cNavigationItems(
              screen?.productBottomNavigation,
              b2cProductsById,
            )
          : [],
      productNavigationLeftArrowUrl: navigationAssetUrl('Linker Nav Pfeil'),
      productNavigationRightArrowUrl: navigationAssetUrl('Rechter Nav Pfeil'),
      productNavigationCatalogIconUrl: navigationAssetUrl('Linker Navbutton'),
      productNavigationCatalogActiveIconUrl: navigationAssetUrl('Linker Navbutton 2'),
    }
  } catch {
    const sharedContent = await sharedContentPromise

    return {
      sections: [],
      navigationItems: sharedContent.navigationItems.map((item) => ({
        ...item,
        href:
          item.key === 'about'
            ? `/about?type=${customerType}`
            : item.key === 'offer'
              ? `/offer?type=${customerType}`
              : item.href,
      })),
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
      b2cProducts: [],
      b2cNavigationItems: [],
    }
  }
}
