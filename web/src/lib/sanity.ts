import {createClient} from '@sanity/client'

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'l6u8bywg',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-01',
  useCdn: true,
}

export const sanityClient = createClient(sanityConfig)
