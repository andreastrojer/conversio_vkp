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
