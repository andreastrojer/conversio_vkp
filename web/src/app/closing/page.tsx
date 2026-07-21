import {redirect} from 'next/navigation'

type ClosingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ClosingPage({searchParams}: ClosingPageProps) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }

    if (value !== undefined) {
      params.set(key, value)
    }
  })

  const serializedParams = params.toString()

  redirect(serializedParams ? `/next-step?${serializedParams}` : '/next-step')
}
