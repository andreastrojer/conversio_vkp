import {getAboutPageData, type ChapterNavigationItem} from '@/lib/about'
import {buildImageUrl, buildLogoUrl, type SanityImage} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {WHAT_FITS_PAGE_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

type CmsMedia = {
  title?: string | null
  altText?: string | null
  mediaType?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  image?: SanityImage
} | null

export type ProductSpecificationRow = {
  _key?: string | null
  label?: string | null
  value?: string | null
}

export type ProductDetailSection = {
  _key: string
  title?: string | null
  text?: string | null
  specificationRows: ProductSpecificationRow[]
  imageUrl?: string
  mediaImageUrl?: string
  mediaUrl?: string
  mediaType?: string | null
  mediaAlt: string
}

export type ProductDetailTab = {
  _key: string
  title: string
  key: string
  sections: ProductDetailSection[]
}

export type WhatFitsProduct = {
  _id: string
  title: string
  slug: string
  catalogLabel: string
  catalogCtaLabel: string
  detailTitle: string
  navigationLabel: string
  sortOrder?: number | null
  catalogImageUrl?: string
  catalogMediaImageUrl?: string
  catalogMediaUrl?: string
  catalogMediaType?: string | null
  catalogMediaAlt: string
  detailImageUrl?: string
  detailMediaImageUrl?: string
  detailMediaUrl?: string
  detailMediaType?: string | null
  detailMediaAlt: string
  detailTabs: ProductDetailTab[]
}

export type ProductNavigationItem = {
  key: string
  label: string
  kind: 'catalog' | 'product' | 'screen'
  slug?: string
  href?: string
}

type ProductDocument = {
  _id?: string | null
  title?: string | null
  slug?: string | null
  categoryType?: string | null
  targetGroup?: string | null
  catalogLabel?: string | null
  catalogCtaLabel?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
  catalogImage?: SanityImage
  catalogMedia?: CmsMedia
  detailTitle?: string | null
  navigationLabel?: string | null
  detailImage?: SanityImage
  detailMedia?: CmsMedia
  detailTabs?: Array<{
    _key?: string | null
    title?: string | null
    key?: string | null
    isActive?: boolean | null
    sections?: Array<{
      _key?: string | null
      title?: string | null
      text?: string | null
      specificationRows?: ProductSpecificationRow[] | null
      image?: SanityImage
      media?: CmsMedia
      isActive?: boolean | null
    }> | null
  }> | null
}

type RawBottomNavigationItem = {
  _id?: string | null
  _key?: string | null
  title?: string | null
  label?: string | null
  navigationLabel?: string | null
  target?: string | null
  slug?: string | null
  screenKey?: string | null
  sortOrder?: number | null
  order?: number | null
  isActive?: boolean | null
  product?: {
    _id?: string | null
    title?: string | null
    slug?: string | null
    navigationLabel?: string | null
    isActive?: boolean | null
  } | null
  items?: RawBottomNavigationItem[] | null
}

type WhatFitsScreenDocument = {
  title?: string | null
  screenKey?: string | null
  headline?: string | null
  subline?: string | null
  heroImage?: SanityImage
  heroMedia?: CmsMedia
  productBottomNavigation?: RawBottomNavigationItem[] | null
} | null

type WhatFitsQueryResult = {
  screen?: WhatFitsScreenDocument
  products?: ProductDocument[] | null
  bottomNavigation?: RawBottomNavigationItem[] | null
  matrixStep?: {
    title?: string | null
    stepKey?: string | null
    order?: number | null
    screen?: {
      title?: string | null
      screenKey?: string | null
    } | null
  } | null
}

export type WhatFitsPageData = {
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
}

const whatFitsClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function isSvgImage(image: SanityImage | undefined) {
  const directAssetUrl = image?.assetUrl || image?.asset?.url

  return Boolean(
    image?.mimeType === 'image/svg+xml' ||
      image?.extension === 'svg' ||
      image?.originalFilename?.toLowerCase().endsWith('.svg') ||
      directAssetUrl?.toLowerCase().endsWith('.svg') ||
      image?.asset?._ref?.endsWith('-svg'),
  )
}

function resolveImageUrl(image: SanityImage | undefined, width = 2600) {
  return isSvgImage(image)
    ? buildLogoUrl(image)
    : buildImageUrl(image, width, undefined, 100)
}

function resolveMediaUrl(media: CmsMedia | undefined) {
  return media?.fileUrl || media?.externalUrl || undefined
}

function normalizeProducts(products: ProductDocument[] | null | undefined): WhatFitsProduct[] {
  return (products || [])
    .filter(
      (product): product is ProductDocument & {_id: string; title: string; slug: string} =>
        Boolean(product._id && product.title?.trim() && product.slug?.trim() && product.isActive !== false),
    )
    .sort((a, b) => {
      const first = typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY
      const second = typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY
      return first - second
    })
    .map((product) => ({
      _id: product._id,
      title: product.title.trim(),
      slug: product.slug.trim(),
      catalogLabel: product.catalogLabel?.trim() || product.title.trim(),
      catalogCtaLabel: product.catalogCtaLabel?.trim() || '',
      detailTitle: product.detailTitle?.trim() || product.title.trim(),
      navigationLabel: product.navigationLabel?.trim() || product.title.trim(),
      sortOrder: product.sortOrder,
      catalogImageUrl: resolveImageUrl(product.catalogImage),
      catalogMediaImageUrl: resolveImageUrl(product.catalogMedia?.image),
      catalogMediaUrl: resolveMediaUrl(product.catalogMedia),
      catalogMediaType: product.catalogMedia?.mediaType,
      catalogMediaAlt:
        product.catalogMedia?.altText || product.catalogMedia?.title || product.catalogLabel || product.title,
      detailImageUrl: resolveImageUrl(product.detailImage),
      detailMediaImageUrl: resolveImageUrl(product.detailMedia?.image),
      detailMediaUrl: resolveMediaUrl(product.detailMedia),
      detailMediaType: product.detailMedia?.mediaType,
      detailMediaAlt:
        product.detailMedia?.altText || product.detailMedia?.title || product.detailTitle || product.title,
      detailTabs: (product.detailTabs || [])
        .filter(
          (tab): tab is NonNullable<ProductDocument['detailTabs']>[number] & {
            _key: string
            title: string
            key: string
          } => Boolean(tab._key && tab.title?.trim() && tab.key?.trim() && tab.isActive !== false),
        )
        .map((tab) => ({
          _key: tab._key,
          title: tab.title.trim(),
          key: tab.key.trim(),
          sections: (tab.sections || [])
            .filter(
              (section): section is NonNullable<typeof tab.sections>[number] & {_key: string} =>
                Boolean(section._key && section.isActive !== false),
            )
            .map((section) => ({
              _key: section._key,
              title: section.title,
              text: section.text,
              specificationRows: (section.specificationRows || []).filter(
                (row) => row.label?.trim() || row.value?.trim(),
              ),
              imageUrl: resolveImageUrl(section.image),
              mediaImageUrl: resolveImageUrl(section.media?.image),
              mediaUrl: resolveMediaUrl(section.media),
              mediaType: section.media?.mediaType,
              mediaAlt:
                section.media?.altText || section.media?.title || section.title || product.detailTitle || product.title,
            })),
        })),
    }))
}

function resolveScreenHref(target: string, customerType: CustomerGroup) {
  if (target.startsWith('/')) {
    return target
  }

  return `/${target}?type=${customerType}`
}

function normalizeBottomNavigation(
  screen: WhatFitsScreenDocument,
  documents: RawBottomNavigationItem[] | null | undefined,
  products: WhatFitsProduct[],
  matrixStep: WhatFitsQueryResult['matrixStep'],
  customerType: CustomerGroup,
) {
  const rawItems = [
    ...(screen?.productBottomNavigation || []),
    ...(documents || []).flatMap((document) => document.items?.length ? document.items : [document]),
  ]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => {
      const first = a.sortOrder ?? a.order ?? Number.POSITIVE_INFINITY
      const second = b.sortOrder ?? b.order ?? Number.POSITIVE_INFINITY
      return first - second
    })

  const normalizedItems = rawItems.flatMap<ProductNavigationItem>((item, index) => {
    const slug = item.product?.slug || item.slug || undefined
    const matchingProduct = slug ? products.find((product) => product.slug === slug) : undefined
    const label =
      item.label?.trim() ||
      item.navigationLabel?.trim() ||
      item.title?.trim() ||
      item.product?.navigationLabel?.trim() ||
      item.product?.title?.trim()

    if (!label) {
      return []
    }

    if (matchingProduct) {
      return [{
        key: item._key || item._id || `product-${matchingProduct.slug}-${index}`,
        label,
        kind: 'product',
        slug: matchingProduct.slug,
      }]
    }

    const target = item.target?.trim() || item.screenKey?.trim()

    if (target && target === screen?.screenKey) {
      return [{key: item._key || item._id || `catalog-${index}`, label, kind: 'catalog'}]
    }

    if (target) {
      return [{
        key: item._key || item._id || `screen-${target}-${index}`,
        label,
        kind: 'screen',
        href: resolveScreenHref(target, customerType),
      }]
    }

    return []
  })

  if (normalizedItems.length > 0) {
    return normalizedItems
  }

  const fallbackItems: ProductNavigationItem[] = []

  if (screen?.headline?.trim()) {
    fallbackItems.push({key: 'catalog', label: screen.headline.trim(), kind: 'catalog'})
  }

  fallbackItems.push(
    ...products.map((product) => ({
      key: `product-${product.slug}`,
      label: product.navigationLabel,
      kind: 'product' as const,
      slug: product.slug,
    })),
  )

  const matrixLabel = matrixStep?.title?.trim() || matrixStep?.screen?.title?.trim()
  const matrixTarget = matrixStep?.screen?.screenKey?.trim() || matrixStep?.stepKey?.trim()

  if (matrixLabel && matrixTarget) {
    fallbackItems.push({
      key: `screen-${matrixTarget}`,
      label: matrixLabel,
      kind: 'screen',
      href: resolveScreenHref(matrixTarget, customerType),
    })
  }

  return fallbackItems
}

export async function getWhatFitsPageData(customerType: CustomerGroup): Promise<WhatFitsPageData> {
  const sharedContentPromise = getAboutPageData(customerType)

  try {
    const [result, sharedContent] = await Promise.all([
      whatFitsClient.fetch<WhatFitsQueryResult>(
        WHAT_FITS_PAGE_QUERY,
        {customerType},
        freshFetchOptions,
      ),
      sharedContentPromise,
    ])
    const products = normalizeProducts(result.products)

    return {
      headline: result.screen?.headline,
      subline: result.screen?.subline,
      products,
      bottomNavigation: normalizeBottomNavigation(
        result.screen || null,
        result.bottomNavigation,
        products,
        result.matrixStep,
        customerType,
      ),
      navigationItems: sharedContent.navigationItems,
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
    }
  } catch {
    const sharedContent = await sharedContentPromise

    return {
      products: [],
      bottomNavigation: [],
      navigationItems: sharedContent.navigationItems,
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
    }
  }
}
