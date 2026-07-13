import {OfferScreen} from '@/components/screens/OfferScreen'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {getOfferPageData} from '@/lib/offer'
import {redirect} from 'next/navigation'

type OfferPageProps = {
  searchParams: Promise<{
    type?: string | string[]
  }>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

export default async function OfferPage({searchParams}: OfferPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const {type} = await searchParams
  const customerType = resolveCustomerType(type)

  if (customerType !== 'b2c') {
    redirect('/offer?type=b2c')
  }

  const content = await getOfferPageData(customerType)

  return (
    <OfferScreen
      customerType={customerType}
      headline={content.headline}
      subline={content.subline}
      sections={content.sections}
      heroImageUrl={content.heroImageUrl}
      heroMediaImageUrl={content.heroMediaImageUrl}
      heroMediaUrl={content.heroMediaUrl}
      heroMediaType={content.heroMediaType}
      heroMediaAlt={content.heroMediaAlt}
      primaryCta={content.primaryCta}
      navigationItems={content.navigationItems}
      logoUrl={content.logoUrl}
      inverseLogoUrl={content.inverseLogoUrl}
      logoAlt={content.logoAlt}
      patternUrl={content.patternUrl}
      patternAlt={content.patternAlt}
      navigationArrowUrl={content.navigationArrowUrl}
    />
  )
}
