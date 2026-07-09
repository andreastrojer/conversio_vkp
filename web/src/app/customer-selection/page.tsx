import {AccountMenu} from '@/components/auth/AccountMenu'
import {AuthBrandingShell} from '@/components/layout/AuthBrandingShell'
import {CustomerSelectionScreen} from '@/components/screens/CustomerSelectionScreen'
import {auth} from '@/lib/auth'
import {
  getAuthPageContent,
  resolveAuthBrandingProps,
  resolveWelcomeProfileProps,
} from '@/lib/authBranding'
import {getCustomerSelectionData} from '@/lib/customerSelection'
import {redirect} from 'next/navigation'

export default async function CustomerSelectionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [content, customerSelectionData] = await Promise.all([
    getAuthPageContent('customer-selection'),
    getCustomerSelectionData(),
  ])
  const brandingProps = resolveAuthBrandingProps(content)
  const profileProps = resolveWelcomeProfileProps(content)

  return (
    <AuthBrandingShell {...brandingProps}>
      <AccountMenu
        userName={session.user.name}
        userEmail={session.user.email}
        menuIconUrl={profileProps.informationIconUrl}
      />

      <CustomerSelectionScreen
        screen={content.screen}
        segments={customerSelectionData.segments}
        formQuestions={customerSelectionData.formQuestions}
        rightPatternUrl={brandingProps.rightPatternUrl}
      />
    </AuthBrandingShell>
  )
}
