import {LoginScreen} from '@/components/auth/LoginScreen'
import {auth} from '@/lib/auth'
import {getAuthPageContent, resolveAuthBrandingProps} from '@/lib/authBranding'
import {redirect} from 'next/navigation'

export const metadata = {
  title: 'Anmelden | Conversio Energie',
}

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/')
  }

  const content = await getAuthPageContent()
  const {screen} = content
  const brandingProps = resolveAuthBrandingProps(content)

  return (
    <LoginScreen
      headline={screen?.headline}
      subline={screen?.subline}
      ctaLabel={screen?.primaryCta?.label}
      {...brandingProps}
    />
  )
}
