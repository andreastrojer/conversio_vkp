import {B2cNeedsScreen} from '@/components/screens/B2cNeedsScreen'
import {WhatFitsScreen} from '@/components/screens/WhatFitsScreen'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {getOfferPageData} from '@/lib/offer'
import {getWhatFitsPageData} from '@/lib/whatFits'
import {redirect} from 'next/navigation'

type WhatFitsPageProps = {
  searchParams: Promise<{
    type?: string | string[]
    product?: string | string[]
    model?: string | string[]
  }>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

function normalizeProductIdentifier(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'u')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function isEnergyCommunityProduct(product: {
  categoryType?: string | null
  slug?: string | null
  title?: string | null
}) {
  const value = normalizeProductIdentifier(
    `${product.categoryType || ''} ${product.slug || ''} ${product.title || ''}`,
  )

  return (
    value.includes('energiegemeinschaft') ||
    value.includes('burgerenergiegemeinschaft') ||
    value.split(/\s+/).includes('beg')
  )
}

export default async function WhatFitsPage({searchParams}: WhatFitsPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const {type, product, model} = await searchParams
  const customerType = resolveCustomerType(type)
  const initialProductSlug = Array.isArray(product) ? product[0] : product
  const initialModelSlug = Array.isArray(model) ? model[0] : model

  if (customerType === 'b2c') {
    const content = await getOfferPageData(customerType, 'whatfits')
    const hasB2cHouseProduct = Boolean(
      initialProductSlug &&
        content.b2cProducts.some((product) => product.slug === initialProductSlug),
    )

    if (initialProductSlug && !hasB2cHouseProduct) {
      const whatFitsContent = await getWhatFitsPageData(customerType)
      const requestedProduct =
        whatFitsContent.products.find((product) => product.slug === initialProductSlug) ||
        (isEnergyCommunityProduct({slug: initialProductSlug})
          ? whatFitsContent.products.find(isEnergyCommunityProduct)
          : undefined)

      if (requestedProduct && isEnergyCommunityProduct(requestedProduct)) {
        return (
          <WhatFitsScreen
            customerType={customerType}
            initialProductSlug={requestedProduct.slug}
            initialModelSlug={initialModelSlug}
            headline={whatFitsContent.headline}
            subline={whatFitsContent.subline}
            products={whatFitsContent.products}
            bottomNavigation={whatFitsContent.bottomNavigation}
            navigationItems={whatFitsContent.navigationItems}
            logoUrl={whatFitsContent.logoUrl}
            inverseLogoUrl={whatFitsContent.inverseLogoUrl}
            logoAlt={whatFitsContent.logoAlt}
            patternUrl={whatFitsContent.patternUrl}
            patternAlt={whatFitsContent.patternAlt}
            navigationArrowUrl={whatFitsContent.navigationArrowUrl}
            productNavigationLeftArrowUrl={whatFitsContent.productNavigationLeftArrowUrl}
            productNavigationRightArrowUrl={whatFitsContent.productNavigationRightArrowUrl}
            productNavigationCatalogIconUrl={whatFitsContent.productNavigationCatalogIconUrl}
            productNavigationCatalogActiveIconUrl={
              whatFitsContent.productNavigationCatalogActiveIconUrl
            }
            modelCardActivePatternUrl={whatFitsContent.modelCardActivePatternUrl}
            modelCardInactivePatternUrl={whatFitsContent.modelCardInactivePatternUrl}
            catalogDetailPointActiveUrl={whatFitsContent.catalogDetailPointActiveUrl}
            catalogDetailPointDarkUrl={whatFitsContent.catalogDetailPointDarkUrl}
            catalogDetailPointInactiveUrl={whatFitsContent.catalogDetailPointInactiveUrl}
            modelGroupAirIconUrl={whatFitsContent.modelGroupAirIconUrl}
            modelGroupImmersionIconUrl={whatFitsContent.modelGroupImmersionIconUrl}
            modelGroupImmersionDarkIconUrl={whatFitsContent.modelGroupImmersionDarkIconUrl}
          />
        )
      }
    }

    return (
      <B2cNeedsScreen
        initialProductSlug={initialProductSlug}
        headline={content.headline}
        houseConfig={content.b2cHouseConfig}
        products={content.b2cProducts}
        productNavigationItems={content.b2cNavigationItems}
        productNavigationLeftArrowUrl={content.productNavigationLeftArrowUrl}
        productNavigationRightArrowUrl={content.productNavigationRightArrowUrl}
        productNavigationCatalogIconUrl={content.productNavigationCatalogIconUrl}
        productNavigationCatalogActiveIconUrl={content.productNavigationCatalogActiveIconUrl}
        navigationItems={content.navigationItems}
        logoUrl={content.logoUrl}
        inverseLogoUrl={content.inverseLogoUrl}
        logoAlt={content.logoAlt}
        navigationArrowUrl={content.navigationArrowUrl}
      />
    )
  }

  const content = await getWhatFitsPageData(customerType)

  return (
    <WhatFitsScreen
      customerType={customerType}
      initialProductSlug={initialProductSlug}
      initialModelSlug={initialModelSlug}
      headline={content.headline}
      subline={content.subline}
      products={content.products}
      bottomNavigation={content.bottomNavigation}
      navigationItems={content.navigationItems}
      logoUrl={content.logoUrl}
      inverseLogoUrl={content.inverseLogoUrl}
      logoAlt={content.logoAlt}
      patternUrl={content.patternUrl}
      patternAlt={content.patternAlt}
      navigationArrowUrl={content.navigationArrowUrl}
      productNavigationLeftArrowUrl={content.productNavigationLeftArrowUrl}
      productNavigationRightArrowUrl={content.productNavigationRightArrowUrl}
      productNavigationCatalogIconUrl={content.productNavigationCatalogIconUrl}
      productNavigationCatalogActiveIconUrl={content.productNavigationCatalogActiveIconUrl}
      modelCardActivePatternUrl={content.modelCardActivePatternUrl}
      modelCardInactivePatternUrl={content.modelCardInactivePatternUrl}
      catalogDetailPointActiveUrl={content.catalogDetailPointActiveUrl}
      catalogDetailPointDarkUrl={content.catalogDetailPointDarkUrl}
      catalogDetailPointInactiveUrl={content.catalogDetailPointInactiveUrl}
      modelGroupAirIconUrl={content.modelGroupAirIconUrl}
      modelGroupImmersionIconUrl={content.modelGroupImmersionIconUrl}
      modelGroupImmersionDarkIconUrl={content.modelGroupImmersionDarkIconUrl}
    />
  )
}
